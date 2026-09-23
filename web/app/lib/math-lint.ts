/**
 * Pure helpers for auditing LaTeX before it reaches the reader.
 *
 * KaTeX only reports a formula it cannot *parse*. A formula can be perfectly
 * valid LaTeX and still print as garbage, and that is exactly what happens when
 * a control sequence loses or gains a backslash while the paper data is written:
 *
 *   `R_{\mathrm{LLM}}`   -> subscript "LLM"                    (correct)
 *   `R_{\\mathrm{LLM}}`  -> `\\` is a line break, so the page   (lost escaping)
 *                           shows the literal word "mathrmLLM"
 *
 * `\\mathrm` raises no error, so error-only checks stay green while the page is
 * visibly wrong. The two detectors below catch it: KaTeX marks a stray `\\`
 * with the `katex-newline` class, and a command name that never received its
 * backslash shows up as a bare word in the source.
 */

/**
 * Command names that are unmistakable garbage when they appear without a
 * backslash. Short generic ones (`in`, `to`, `top`) are excluded because a
 * formula may legitimately print them.
 */
const COMMAND_NAMES = [
  "mathrm",
  "mathbf",
  "mathcal",
  "mathbb",
  "mathit",
  "mathsf",
  "mathtt",
  "mathfrak",
  "mathnormal",
  "mathds",
  "boldsymbol",
  "operatorname",
  "widehat",
  "widetilde",
  "overline",
  "underline",
  "overbrace",
  "underbrace",
  "underset",
  "overset",
  "stackrel",
  "substack",
  "ensuremath",
  "hbox",
  "mbox",
  "dfrac",
  "tfrac",
  "cfrac",
  "binom",
  "genfrac",
  "triangleq",
  "hspace",
  "vspace",
  "displaystyle",
  "textstyle",
  "scriptstyle",
  "qquad",
  "ldots",
  "cdots",
  "vdots",
  "ddots",
  "nonumber",
  "newline",
  "left",
  "right",
];

/** `\cmd` -> cmd, for every control sequence in the source. */
export function controlWords(tex: string): string[] {
  const found = new Set<string>();
  for (const match of tex.matchAll(/\\([A-Za-z]+)/g)) found.add(match[1]);
  return [...found];
}

/**
 * Command names written without their backslash, which KaTeX then renders as
 * loose italic letters instead of a command. `\\mathrm` is not reported here —
 * the line-break detector owns that case.
 */
export function unescapedCommandNames(tex: string): string[] {
  const pattern = new RegExp(`(?<![\\\\A-Za-z])(${COMMAND_NAMES.join("|")})(?![A-Za-z])`, "g");
  return [...new Set([...tex.matchAll(pattern)].map((match) => match[1]))];
}

/** KaTeX tags a stray `\\` outside a multi-line environment this way. */
export function hasStrayLineBreak(html: string): boolean {
  return /class="[^"]*katex-newline[^"]*"/.test(html);
}

/** KaTeX renders a formula it cannot parse into a `katex-error` span. */
export function hasKatexError(html: string): boolean {
  return html.includes("katex-error");
}

export type MathSpan = {
  /** `inline` for `$...$`, `display` for `$$...$$`. */
  kind: "inline" | "display";
  tex: string;
  start: number;
};

/**
 * Extract math spans the way remark-math treats this corpus: fenced code blocks
 * and inline code are skipped, `\$` stays literal, `$$` wins over `$`, and an
 * unclosed delimiter is not math at all.
 */
export function mathSpans(markdown: string): MathSpan[] {
  const withoutCode = markdown.replace(
    /```[\s\S]*?```|`[^`\n]*`/g,
    (block) => " ".repeat(block.length),
  );
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const spans: MathSpan[] = [];
  for (const match of withoutCode.matchAll(pattern)) {
    const isDisplay = match[1] !== undefined;
    spans.push({
      kind: isDisplay ? "display" : "inline",
      tex: (isDisplay ? match[1] : match[2]).trim(),
      start: match.index ?? 0,
    });
  }
  return spans;
}

/** An odd number of `$$` leaves raw LaTeX visible as prose. */
export function unbalancedDelimiters(markdown: string): boolean {
  const withoutCode = markdown.replace(
    /```[\s\S]*?```|`[^`\n]*`/g,
    (block) => " ".repeat(block.length),
  );
  const withoutEscaped = withoutCode.replace(/\\\$/g, "  ");
  return (withoutEscaped.match(/\$\$/g) ?? []).length % 2 !== 0;
}
