# Paper Reader Website Contract

## Project resolution

Resolve the target site in this order:

1. an explicit path supplied by the user;
2. the current repository when it matches the architecture below;
3. a single matching project under the current workspace.

Never embed a developer's absolute path, account name, hosting project ID, or credential in this public contract. If more than one site matches, ask the user to choose before editing.

If `.openai/hosting.json` exists, read it before any hosting action and reuse its opaque `project_id` exactly. Never create a second site for the same local project.

## Expected architecture

```text
app/
  components/
    CollectionLandingApp.tsx
    PaperLibraryApp.tsx
    PaperReaderApp.tsx
  data/
    collections.ts
    library.ts
    papers/
      <slug>/
        paper.ts
        report.ts
    <paper-key>-paper.ts
    <paper-key>-report.ts
  lib/
    content.ts
    library.ts
    search.ts
  papers/
    <slug>/
      page.tsx
  collections/
    <collection>/
      page.tsx
public/
  papers/
    <slug>.pdf
    <slug>/
      figures/
        ...
```

The nested and flat data layouts are both valid. Adapt import paths to the actual
application, but preserve one paper-specific data namespace, one paper-specific
route, and one paper-specific public asset namespace. The route's imports are the
source of truth for locating its paper and report modules.

## Registry contract

The registry consumes this type or an equivalent typed schema:

```ts
type LibraryPaper = {
  slug: string;
  collection: string;
  titleEn: string;
  titleZh: string;
  authors: string;
  year: number;
  domains: string[];
  publication: {
    kind: "conference" | "journal" | "workshop" | "preprint";
    status: "published" | "accepted" | "preprint";
    venue: string;
    year: number;
    url: string;
    note?: string;
  };
  status: "completed" | "reading" | "queued";
  progress: number;
  stage: string;
  summary: string;
  updatedAt: string;
  href?: string;
  codeUrl?: string;
  isExample?: boolean;
};
```

Rules:

- Use verified bibliographic metadata.
- Name a conference or journal only when an official venue, publisher, or paper record confirms acceptance.
- Workshop papers must use `kind: "workshop"` and a visible Workshop label; never present them as main-track papers.
- Under-review or unconfirmed work must use `kind: "preprint"`, `status: "preprint"`, and `venue: "arXiv"`.
- Use `note` when an accepted version has a materially different title from the current arXiv record.
- Assign an explicit high-level `collection`. Reuse an existing collection only when the paper belongs there; otherwise use `uncategorized`.
- Never default a new paper to `world-models` merely because an existing library currently contains world-model papers.
- When a deliberate new topic is introduced, register it in the collection registry and create `/collections/<collection>` before publishing the paper card.
- Omit `href` until a working route exists.
- `codeUrl` is optional and must be identified by the paper, author project page, or official research organization. Omit it when unverified; never render a placeholder, guessed repository, unofficial mirror, or third-party reproduction.
- A completed paper has `status: "completed"`, `progress: 100`, and a real `href`.
- A processing card has `status: "reading"` and a truthful current stage.
- A queued card has `status: "queued"` and must not imply processing has started.
- Example cards have `isExample: true`; never present them as real papers.
- Replace at most one appropriate example card when registering a real paper.

See `examples/library-entry.ts` for a non-paper placeholder example.

## Personal reading completion

When the target reader has user-controlled read marks, preserve them during
ingestion. Keep these marks separate from `status`, which describes report
processing. Never mark a paper as read merely because its report is complete.

If a user requests a flip-card treatment, use explicit mark/unmark controls,
keep paper and code links independent, keep the front face in normal layout so
long titles cannot be clipped, and respect reduced-motion preferences. Store
only stable paper IDs for device-local persistence; do not imply account sync.

## Reader route contract

Each route imports its own paper and report modules and renders the shared reader:

```tsx
import type { Metadata } from "next";
import { PaperReaderApp } from "../../components/PaperReaderApp";
import { paperSections } from "../../data/papers/<slug>/paper";
import { reportMarkdown } from "../../data/papers/<slug>/report";

export const metadata: Metadata = {
  title: "<Short title> · 双语精读 | Paper Atlas",
  description: "<English title> 英文原文、中文翻译、论文图表与 13 章精读报告。",
};

export default function PaperPage() {
  return (
    <PaperReaderApp
      sections={paperSections}
      reportMarkdown={reportMarkdown}
    />
  );
}
```

Inspect shared components for hard-coded:

- title, short title, author, affiliation, venue, and identifier;
- PDF and figure paths;
- local-storage keys;
- brand marks or paper-specific colors.

Move paper identity into typed route-specific metadata. Defaults must not silently show another paper's metadata or assets. A flat data layout may import, for example, `../../data/<paper-key>-paper`; do not rename existing modules merely to match this example.

## Paper data contract

Use a typed `PaperSection[]` representation. A recommended minimum is:

```ts
type PaperBlock = {
  id: string;
  sectionId: string;
  kind: "paragraph" | "heading" | "equation" | "algorithm" | "figure" | "table";
  english: string;
  chinese: string;
  evidenceKey: string;
  asset?: {
    src: string;
    alt: string;
    captionEn?: string;
    captionZh?: string;
  };
};

type PaperSection = {
  id: string;
  titleEn: string;
  titleZh: string;
  blocks: PaperBlock[];
};
```

Required invariants:

- section IDs are unique;
- block IDs are unique across the paper;
- each block's `sectionId` matches its parent;
- every source-text block has non-empty English and Chinese text;
- English source text is not replaced by a summary;
- equations retain notation;
- figure and table assets use paper-specific paths and meaningful alt text;
- figure captions remain distinguishable from the agent's analysis;
- evidence keys are stable targets for report jumps;
- all main sections are present.

## Figure and table contract

- Extract figures and tables from the source PDF at readable resolution.
- Preserve original figure/table numbering in metadata and captions.
- Place an asset near the aligned paragraph where the paper first introduces or interprets it.
- Show the original English caption and a faithful Chinese translation.
- Do not redraw a scientific figure unless the user explicitly asks; a redraw must be labeled as such.
- Visually verify that each asset matches its number, caption, and nearby discussion.
- If extraction quality is insufficient, render the relevant PDF region and record the fallback.

## Work state

Keep resumable processing state outside the deployed site:

```text
<workspace>/work/paper-atlas/<slug>/progress.json
```

Recommended shape is in `examples/progress.json`.

Update it after each durable phase. Do not commit source PDFs without permission, scratch extraction files, local paths, or progress state to the public skill repository.

## Publication contract

When the target project already has hosting configuration:

1. Run tests and a production build.
2. Visually verify the reading route.
3. Ensure the Git working tree contains only intended changes.
4. Commit and push the exact validated source without persisting credentials.
5. Package the same commit.
6. Save one version using the pushed commit SHA.
7. Deploy with the intended access level.
8. Poll deployment status until a terminal state.

When no hosting configuration exists, complete the local route and validation, then ask before creating a new production site because production deployment changes external state and access.
