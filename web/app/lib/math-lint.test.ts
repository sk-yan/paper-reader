import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import katex from "katex";
import {
  hasKatexError,
  hasStrayLineBreak,
  mathSpans,
  unbalancedDelimiters,
  unescapedCommandNames,
} from "./math-lint";
import { normalizePaperMath, paperMathOptions } from "./math-options";

type Block = { id: string; english: string; chinese: string };
type Section = { id: string; blocks: Block[] };
type PaperRecord = { slug: string; sources: [string, string][] };

const DATA_DIR = join(process.cwd(), "app/data/papers");

/** Every string a reader renders: each block in both languages, plus the report. */
async function loadPaperSources(): Promise<PaperRecord[]> {
  const papers: PaperRecord[] = [];
  for (const slug of readdirSync(DATA_DIR).sort()) {
    const sources: [string, string][] = [];
    for (const [file, label] of [
      ["paper.ts", "paper"],
      ["report.ts", "report"],
    ] as const) {
      const path = join(DATA_DIR, slug, file);
      if (!existsSync(path)) continue;
      const loaded = (await import(/* @vite-ignore */ path)) as Record<string, unknown>;
      for (const value of Object.values(loaded)) {
        if (typeof value === "string") sources.push([`${label}:export`, value]);
        if (Array.isArray(value)) {
          for (const section of value as Section[]) {
            for (const block of section.blocks ?? []) {
              sources.push([`${label}:${block.id}#en`, block.english]);
              sources.push([`${label}:${block.id}#zh`, block.chinese]);
            }
          }
        }
      }
    }
    if (sources.length) papers.push({ slug, sources });
  }
  return papers;
}

const papers = await loadPaperSources();

function render(tex: string, displayMode: boolean): string {
  return katex.renderToString(normalizePaperMath(tex), {
    ...paperMathOptions,
    displayMode,
    throwOnError: false,
  });
}

describe("math render audit", () => {
  it("catches an escaped-backslash control sequence that KaTeX still accepts", () => {
    const broken = "R_{\\\\mathrm{LLM}}(Q, q_j)";
    const html = render(broken, false);
    expect(hasKatexError(html)).toBe(false);
    expect(hasStrayLineBreak(html)).toBe(true);
  });

  it("catches a command name that lost its backslash entirely", () => {
    expect(unescapedCommandNames("R_{mathrm{LLM}}")).toEqual(["mathrm"]);
    expect(unescapedCommandNames(String.raw`R_{\mathrm{LLM}}`)).toEqual([]);
    expect(unescapedCommandNames(String.raw`\left\{ x \right\}`)).toEqual([]);
    expect(unescapedCommandNames(String.raw`\begin{cases} a \\ b \end{cases}`)).toEqual([]);
  });

  it("accepts multi-line environments and display formulas", () => {
    const aligned = String.raw`\begin{aligned} a &= b \\ c &= d \end{aligned}`;
    expect(hasStrayLineBreak(render(aligned, true))).toBe(false);
    const display = String.raw`\{\hat{G}_{\mathrm{inter}}^{Q_i}\}_{i=1}^{|M|} = \left\{S_{\mathrm{LLM}}\left(G_{\mathrm{inter}}^{(Q_j)},\ Q\right)\right\}`;
    const html = render(display, true);
    expect(hasKatexError(html)).toBe(false);
    expect(hasStrayLineBreak(html)).toBe(false);
  });

  it("ignores code spans and escaped dollars when finding math", () => {
    expect(mathSpans("costs \\$5 and `$notmath$` here")).toHaveLength(0);
    expect(mathSpans("$a$ and $$b$$")).toMatchObject([
      { kind: "inline", tex: "a" },
      { kind: "display", tex: "b" },
    ]);
    expect(unbalancedDelimiters("$$a + b$")).toBe(true);
    expect(unbalancedDelimiters("$$a + b$$")).toBe(false);
  });

  it("loads the whole library", () => {
    expect(papers.length).toBeGreaterThan(10);
    expect(papers.reduce((total, paper) => total + paper.sources.length, 0)).toBeGreaterThan(500);
  });

  it("renders every stored formula without errors or leaked control sequences", () => {
    const failures: string[] = [];
    for (const paper of papers) {
      for (const [where, markdown] of paper.sources) {
        if (!markdown.includes("$")) continue;
        const location = `${paper.slug}/${where}`;
        if (unbalancedDelimiters(markdown)) failures.push(`${location}: unbalanced $$ delimiter`);
        for (const span of mathSpans(markdown)) {
          const snippet = span.tex.slice(0, 60).replace(/\s+/g, " ");
          for (const name of unescapedCommandNames(span.tex)) {
            failures.push(`${location}: "${name}" has no backslash in ${snippet}`);
          }
          const html = render(span.tex, span.kind === "display");
          if (hasKatexError(html)) failures.push(`${location}: katex-error in ${snippet}`);
          if (hasStrayLineBreak(html)) failures.push(`${location}: stray \\ in ${snippet}`);
        }
      }
    }
    expect(failures.join("\n")).toBe("");
  }, 60000);
});
