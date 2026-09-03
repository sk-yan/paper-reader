#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: validate-paper-entry.sh <site-root> <slug>" >&2
  exit 2
fi

SITE_ROOT=$1
SLUG=$2

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

warn() {
  echo "WARN: $1" >&2
}

[ -d "$SITE_ROOT" ] || fail "site root not found: $SITE_ROOT"
[ -f "$SITE_ROOT/app/data/library.ts" ] || fail "missing paper registry"
[ -f "$SITE_ROOT/app/lib/content.ts" ] || fail "missing PaperSection contract"

if [ -f "$SITE_ROOT/.openai/hosting.json" ]; then
  pass "hosting configuration found"
else
  warn "no .openai/hosting.json; deployment checks are skipped"
fi

if ! grep -Eq "slug:[[:space:]]*[\"']$SLUG[\"']" "$SITE_ROOT/app/data/library.ts"; then
  fail "registry has no slug: $SLUG"
fi
pass "registry entry"

python3 - "$SITE_ROOT/app/data/library.ts" "$SLUG" <<'PY'
import re
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text(encoding="utf-8")
slug = sys.argv[2]
slug_match = re.search(rf"slug:\s*[\"']{re.escape(slug)}[\"']", source)
if slug_match is None:
    raise SystemExit(f"FAIL: registry has no slug: {sys.argv[2]}")

start = source.rfind("{", 0, slug_match.start())
if start < 0:
    raise SystemExit(f"FAIL: cannot parse registry entry: {slug}")

depth = 0
quote = None
escaped = False
end = None
for index, char in enumerate(source[start:], start=start):
    if quote:
        if escaped:
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == quote:
            quote = None
        continue
    if char in {"\"", "'", "`"}:
        quote = char
    elif char == "{":
        depth += 1
    elif char == "}":
        depth -= 1
        if depth == 0:
            end = index + 1
            break

if end is None:
    raise SystemExit(f"FAIL: cannot parse registry entry: {slug}")
entry = source[start:end]

if not re.search(r"collection:\s*[\"'][^\"']+[\"']", entry):
    raise SystemExit(
        f"FAIL: registry entry has no explicit collection: {sys.argv[2]}"
    )
publication = re.search(r"publication:\s*\{(?P<body>.*?)\n\s*\}", entry, re.DOTALL)
if publication is None:
    raise SystemExit(
        f"FAIL: registry entry has no explicit publication: {sys.argv[2]}"
    )
body = publication.group("body")
for field in ("kind", "status", "venue", "year", "url"):
    if not re.search(rf"\b{field}\s*:", body):
        raise SystemExit(
            f"FAIL: publication metadata missing {field}: {sys.argv[2]}"
        )
PY
pass "explicit collection and publication assignment"

ROUTE_FILE="$SITE_ROOT/app/papers/$SLUG/page.tsx"

[ -f "$ROUTE_FILE" ] || fail "missing reader route: $ROUTE_FILE"
grep -q "PaperReaderApp" "$ROUTE_FILE" || fail "route does not render PaperReaderApp"
pass "reader route"

python3 - "$SITE_ROOT" "$ROUTE_FILE" "$SLUG" <<'PY'
import re
import sys
from pathlib import Path

site_root = Path(sys.argv[1]).resolve()
route_path = Path(sys.argv[2]).resolve()
slug = sys.argv[3]
route = route_path.read_text(encoding="utf-8")


def resolve_module(specifier):
    if not specifier.startswith("."):
        return None
    base = (route_path.parent / specifier).resolve()
    candidates = [
        base,
        base.with_suffix(".ts"),
        base.with_suffix(".tsx"),
        base / "index.ts",
        base / "index.tsx",
    ]
    return next((candidate for candidate in candidates if candidate.is_file()), None)


module_paths: list[Path] = []
for specifier in re.findall(r'from\s+["\']([^"\']+)["\']', route):
    resolved = resolve_module(specifier)
    if resolved and resolved not in module_paths:
        module_paths.append(resolved)

canonical = site_root / "app" / "data" / "papers" / slug
for candidate in [canonical / "paper.ts", canonical / "report.ts"]:
    if candidate.is_file() and candidate not in module_paths:
        module_paths.append(candidate)

if not module_paths:
    raise SystemExit("FAIL: route imports no resolvable local data modules")

paper_match = None
report_match = None

for module_path in module_paths:
    content = module_path.read_text(encoding="utf-8")
    en_count = len(re.findall(r'(?:"english"|english)\s*:', content))
    zh_count = len(re.findall(r'(?:"chinese"|chinese)\s*:', content))
    if en_count > 0 and en_count == zh_count and paper_match is None:
        paper_match = (module_path, content, en_count, zh_count)

    decoded = content.replace("\\n", "\n")
    chapters = re.findall(r"^##\s+(\d+)\.", decoded, flags=re.MULTILINE)
    if chapters and report_match is None:
        report_match = (module_path, decoded, chapters)

if paper_match is None:
    raise SystemExit("FAIL: no imported module contains aligned English/Chinese blocks")
if report_match is None:
    raise SystemExit("FAIL: no imported module contains numbered report chapters")

paper_path, paper, en_count, zh_count = paper_match
report_path, decoded_report, chapters = report_match

expected = [str(index) for index in range(1, 14)]
if chapters != expected:
    raise SystemExit(
        "FAIL: report chapters must be exactly 1..13; found " + ",".join(chapters)
    )

questions = re.findall(r"^###\s+题\s*\d+", decoded_report, flags=re.MULTILINE)
if len(questions) != 10:
    raise SystemExit(f"FAIL: expected 10 reading questions; found {len(questions)}")

pdf_href_match = re.search(r'pdfHref\s*:\s*["\']([^"\']+)["\']', route)
pdf_href = pdf_href_match.group(1) if pdf_href_match else f"/papers/{slug}.pdf"
pdf_path = site_root / "public" / pdf_href.lstrip("/")
if not pdf_path.is_file() or pdf_path.stat().st_size == 0:
    raise SystemExit(f"FAIL: missing or empty PDF: {pdf_path}")

print(f"PASS: paper module {paper_path.relative_to(site_root)}")
print(f"PASS: report module {report_path.relative_to(site_root)}")
print(f"PASS: PDF {pdf_path.relative_to(site_root)}")
print(f"PASS: {en_count} aligned bilingual blocks")
print("PASS: 13 report chapters")
print("PASS: 10 reading-check questions")
PY

pass "paper reader entry is structurally complete"
