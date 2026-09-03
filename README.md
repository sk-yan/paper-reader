# Paper Reader

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Agent Skill](https://img.shields.io/badge/Agent-Skill-6f42c1)](SKILL.md)

Paper Reader is a complete research-paper reading workflow for AI agents. Give
your agent a PDF or paper link and it turns the source into a bilingual reader,
a source-grounded deep-reading report, and a verified web-library entry.

它把“读 PDF、逐段翻译、精读论文、提取图表、写报告、放到前端”收敛成一个
可重复执行的 Agent Skill。

This repository contains the reusable **skill package**, not a hosted Paper
Atlas website. It ships no private papers, user accounts, API keys, deployment
credentials, or personal project configuration.

## What You Get

For each paper, the workflow produces:

- a complete source map covering sections, equations, algorithms, figures,
  tables, appendices, and references;
- aligned English source blocks and meaning-preserving Chinese translation;
- original paper figures and tables placed beside the relevant discussion;
- a fixed 13-chapter Chinese close-reading report with plain-language mentor explanations after substantive subsections;
- exactly five research directions and 10 answered reading-check questions;
- a resumable processing record and deterministic structural validation;
- optionally, a paper card and reader route in an existing web library.

## Quickstart

Install the skill, then give your agent a paper:

```text
Read this paper from scratch. Build an English-Chinese reader, write the
13-chapter deep-reading report, and add it to my paper library.
```

中文直接说：

```text
把这篇论文加入论文精读库，逐段翻译，完成 13 章精读报告并放到前端。
```

You can also invoke the installed skill explicitly:

```text
$paper-reader Read arXiv:2506.18088 from scratch and add it to my bilingual paper library.
```

The skill triggers from natural requests. You do not need to memorize a command
or restate the reading rubric every time.

## How it works

Paper Reader starts with the source, not with a generic summary.

First, the agent maps the complete paper: metadata, sections, equations,
algorithms, figures, tables, appendices, and references. It then aligns the
verbatim English text with meaning-preserving Chinese translation, keeping
stable evidence IDs throughout.

Next, it teaches the paper in a fixed 13-chapter report: background, problem
definition, method, formulas, experiments, cost, real contributions, related
work, reproduction, research ideas, and reading-check questions. Paper facts,
evaluation, inference, and uncertainty stay visibly separate. Every substantive
subsection ends with a concise mentor explanation of what the section is doing,
how its steps connect, and why the design is needed.

Finally, it adds the PDF, figures, bilingual content, report, route, and library
card to an existing web reader. Structural checks, a production build, and
visual inspection happen before the agent claims completion.

## Installation

### Codex App and Codex CLI

Clone the repository into your Codex skills directory:

```bash
git clone https://github.com/sk-yan/paper-reader.git \
  ~/.codex/skills/paper-reader
```

Restart Codex or begin a new task so the skill catalog refreshes.

Then attach a PDF, provide an arXiv/DOI/publisher link, or name an identifiable
paper. If you want web integration, also open the existing reader project or
provide its local path.

### Existing checkout

If you want to edit the skill locally, clone it anywhere and link it:

```bash
git clone https://github.com/sk-yan/paper-reader.git
mkdir -p ~/.codex/skills
ln -s "$PWD/paper-reader" ~/.codex/skills/paper-reader
```

### Other Agent Skills-compatible tools

Copy or link this repository into the tool's skills directory. The essential
entrypoint is `SKILL.md`; keep `references/`, `scripts/`, and `examples/`
beside it because the workflow reads them at runtime.

## Requirements

- An Agent Skills-compatible coding agent that can read `SKILL.md`.
- PDF extraction and page-rendering capability for PDF sources.
- Enough model context or a resumable workflow for full-paper translation.
- An existing web-reader project only if you want a deployed library entry.

The skill itself does not require a specific commercial model API. Individual
agents may use whatever PDF, translation, browser, or hosting capabilities are
configured in their environment. When a capability is unavailable, the skill
requires the agent to disclose the fallback and preserve the evidence contract.

## The Basic Workflow

1. **Resolve and register** — Find the source and web-reader project, reuse an
   existing paper slug, and record truthful `reading`, `queued`, or `completed`
   state.

2. **Map the source** — Recover every main section, formula, algorithm, figure,
   table, appendix, and reference before writing conclusions.

3. **Align bilingual content** — Preserve English source text and create
   meaning-aligned Chinese blocks with stable IDs and evidence targets.

4. **Place figures and tables** — Extract readable assets, preserve numbering
   and captions, and put them beside the source discussion they belong to.

5. **Write the deep-reading report** — Produce exactly 13 chapters, five
   research directions, and 10 answered reading-check questions.

6. **Build the reader** — Add the PDF, assets, typed data, paper route, and
   library card without leaking metadata from another paper.

7. **Verify and publish** — Run structural checks, tests, production build, and
   visual QA; deploy only when the target project already has an approved
   hosting path.

## Collection-aware libraries

Every paper registry entry must name one high-level `collection`. Collections
are independent shelves such as `world-models`, `medical-ai`, or `agents`;
multi-valued `domains` remain filters inside a shelf.

Reuse an existing collection only when the paper belongs there. If the topic is
genuinely unclear, register the paper as `uncategorized` for later review.
Never default a new paper to `world-models` merely because the first papers in a
library happened to use that topic. A deliberate new theme should receive a
collection definition and a `/collections/<collection>` route.

## Verified publication labels

Every paper card should state where the work was published or accepted. Use an
official venue, publisher, or paper record as evidence. Workshop papers must be
labeled as workshops and must not be presented as main-track papers. If no
acceptance can be confirmed—or the paper is only under review—display it as an
`arXiv` preprint instead of guessing a venue.

Store this as structured `publication` metadata (`kind`, `status`, `venue`,
`year`, and evidence `url`). Use an optional note when the accepted version has
a materially different title from the current preprint.

Official code links are optional. Add `codeUrl` only when the paper, an author
project page, or the official research organization identifies the repository.
If that evidence is missing, omit the button entirely—never guess from a
same-name repository or link a third-party reproduction.

## Personal reading marks

For readers that support an “already read” card flip, keep the user's reading
mark separate from processing status: a report can be fully generated without
having been read. A completion back face may use a checkmark seal and a reversible
flip action. Preserve existing marks when adding papers, and explain that
browser-local storage does not synchronize between devices. Respect keyboard
navigation and reduced-motion settings.

This repository supplies the ingestion skill and integration contracts, not a
standalone copy of a user's deployed website or private paper library.

## What's Inside

### Skill

- **`SKILL.md`** — Trigger phrases, end-to-end workflow, boundaries, and
  handoff requirements.

### Contracts

- **`references/web-reader-contract.md`** — Web project discovery, typed paper
  data, route, registry, figure placement, progress, and publication rules.
- **`references/report-contract.md`** — The complete 13-chapter teaching and
  evidence contract.

### Validation

- **`scripts/validate-paper-entry.sh`** — Resolves paper/report modules from the
  route and checks the registry, PDF, bilingual blocks, 13 chapters, and 10
  reading questions.

### Examples

- **`examples/library-entry.ts`** — Typed library-card example.
- **`examples/progress.json`** — Resumable processing-state example.

## Website Contract

The default integration target is a Next.js paper library with shared reader
components:

```text
app/
  components/PaperReaderApp.tsx
  data/library.ts
  data/<paper-modules>.ts
  lib/content.ts
  papers/<slug>/page.tsx
public/papers/
```

Nested paper data directories and flat paper modules are both supported. The
paper route's relative imports are the source of truth. Adapt
[`references/web-reader-contract.md`](references/web-reader-contract.md) before
using the skill with a different architecture.

If no compatible site is available, the paper-reading artifacts can still be
completed locally. The agent should ask before creating a new production site
or changing its access policy.

## Validation

Run the structural validator against a completed entry:

```bash
bash scripts/validate-paper-entry.sh /absolute/path/to/site paper-slug
```

The validator is intentionally narrow. It cannot prove that a translation is
faithful, an experimental claim is correct, or a figure matches its caption;
the agent must still inspect those against the source PDF.

## Philosophy

- **Source before summary** — Build a complete paper map before explaining it.
- **Evidence over confidence** — Bind important claims to sections, equations,
  algorithms, figures, tables, or experiments.
- **Facts are not critique** — Separate what the paper says from evaluation and
  new research proposals.
- **Figures belong in context** — Put scientific assets where the paper
  introduces or interprets them.
- **Progress must be truthful** — `reading`, `queued`, and `completed` are
  operational states, not decoration.
- **Verification before completion** — A generated page is not delivered until
  its structure, build, and visual reading experience are checked.

## Privacy and Safety

Paper Reader contains no API keys, login automation, billing logic, or browser
cookie handling. It does not require client-side upload of private PDFs.

Do not commit source PDFs without permission. Never publish local absolute
paths, hosting project IDs, progress files, account details, tokens, or
deployment credentials.

## License

MIT License — see [LICENSE](LICENSE).
