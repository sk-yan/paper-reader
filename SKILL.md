---
name: paper-reader
description: Use when the user sends a research paper PDF or link and asks to read a paper, translate a PDF, create a deep-reading report, build a bilingual paper reader, add a paper to a reading library, “论文精读”, “逐段翻译”, “加入论文库”, or continue a paper already being processed.
---

# Paper Reader

## Goal

Turn one supplied paper into a source-grounded bilingual reader, a 13-chapter Chinese close-reading report, a Paper Atlas library card, and a verified deployment when hosting is configured.

The website is the reading surface; the agent is the processor.

## Required reading

Read completely before acting:

- `references/web-reader-contract.md`
- `references/report-contract.md`

Load equivalent capabilities available in the current environment:

- PDF extraction and visual inspection for PDF sources
- full-paper extraction and bilingual alignment
- site building and hosting when `.openai/hosting.json` exists
- verification before claiming delivery

If a named capability is unavailable, state the fallback and preserve the same evidence and validation contract.

## Default workflow

### 1. Resolve and register

Resolve the source and an existing paper-reader web project. Use the site path supplied by the user; otherwise search the current workspace for the architecture in the project contract. If multiple plausible projects remain, ask before editing.

Derive a stable slug, search for prior work, and resume rather than duplicate. Create the progress file specified by the project contract. Register truthful metadata with `status: "reading"`, an explicit high-level `collection`, and structured `publication` evidence. Name a conference or journal only when acceptance is confirmed by an official venue, publisher, or paper record; label workshop papers as workshops, and use `arXiv` preprint status for unconfirmed or under-review work. Add optional `codeUrl` only when the paper, author project page, or official research organization identifies the repository; omit it rather than guessing or linking a third-party reproduction. Reuse an existing collection when justified, otherwise use `uncategorized`. Never infer `world-models` merely because the current library began with that topic. Replace at most one appropriate example card. Publish an intermediate state only when processing spans multiple turns and the user benefits from seeing progress.

### 2. Build a source map

Recover bibliographic metadata, abstract, sections, equations, algorithms, figures, tables, appendices, and references. Prefer selectable text; use OCR only when required. Use HTML only to repair layout or formulas and record that fallback. The paper remains the source of truth.

### 3. Build aligned bilingual content

Create `PaperSection[]` with stable IDs, block kinds, verbatim English, meaning-preserving Chinese, and evidence keys. Preserve formulas and code, translate terms consistently, and place each figure or table near the source passage that introduces or analyzes it. Keep the main paper expanded; appendices, prompts, and references may start collapsed but remain accessible.

### 4. Write the report

Follow the report contract exactly: 13 numbered chapters, evidence-bound conclusions, fact/evaluation separation, plain-language `导师解读` after every substantive subsection, five research directions, and 10 answered reading-check questions. Each mentor paragraph must explain what the subsection is doing, the causal sequence, why the design is necessary, and the practical consequence instead of paraphrasing the preceding prose. Label unsupported analysis `这是推断`; use `不确定` when evidence is insufficient.

### 5. Add the reader route

Store the paper-specific PDF, extracted figures, and typed data; create `/papers/<slug>`; update the registry; retain the existing reader design and accessible typography; and link back to the paper's collection page. When introducing an intentional new research theme, add its collection definition and `/collections/<collection>` route; uncertain classifications stay in `uncategorized`. Generalize shared reader metadata if another paper's identity, PDF path, figure base path, or local-storage key remains hard-coded.

### 6. Validate and publish

Run:

```bash
bash scripts/validate-paper-entry.sh "<site-root>" "<slug>"
```

Run the site's full tests and production build, then visually inspect the library card, bilingual blocks, formulas, figure placement, report navigation, and PDF link.

When hosting is configured, commit and push the exact validated source, package that commit, save one version, deploy with the intended access level, and poll to a terminal success state. Never create a second hosting project when a valid project ID already exists.

### 7. Handoff

Return the homepage URL or path, direct reader URL or path, final status, validation evidence, and any source limitation. Never expose deployment credentials, API tokens, private repository details, or local personal paths.

## Boundaries

Do not add model API billing, browser-side private-PDF processing, ChatGPT-cookie automation, or account impersonation. Do not invent paper content. Stop only when the source is unreadable, paper identity is ambiguous, the project cannot be located, or publication needs a new access decision. Otherwise proceed.

## Trigger example

User: `把这篇 PDF 加入论文精读库，做完精读放到前端。`

Start the workflow immediately; do not ask the user to restate requirements already captured by the contracts.
