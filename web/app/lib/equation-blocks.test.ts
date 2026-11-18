import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { PaperBlock } from "./content";
import { blockColumns, displayFormulas } from "./equation-blocks";

const block = (english: string, chinese: string, kind: PaperBlock["kind"] = "equation"): PaperBlock => ({
  id: "b1",
  sectionId: "s1",
  kind,
  english,
  chinese,
});

const formula = "$$\n\\hat{G} = S_{\\mathrm{LLM}}(x)\n$$";
const other = "$$\nx + y\n$$";
/** The shape upstream uses for the formula blocks in `memoir`: the Chinese
 * column repeats the formula and adds a label in front of it. */
const labelled = (tex: string) => `公式（符号保持不变）：\n\n${tex}\n\n (1)`;

describe("equation block columns", () => {
  it("reads every display formula in order", () => {
    expect(displayFormulas(`${formula} text ${other}`)).toEqual([
      String.raw`\hat{G} = S_{\mathrm{LLM}}(x)`,
      "x + y",
    ]);
  });

  it("draws the formula once when the Chinese column only repeats it", () => {
    const target = block(`\n${formula}\n`, `\n${formula}\n`);
    expect(blockColumns(target, "parallel")).toEqual({
      english: `\n${formula}\n`,
      chinese: null,
    });
  });

  it("pairs the formula with the Chinese note that follows it", () => {
    const target = block(
      `\n\n${formula}\n\n`,
      `\n\n${formula}\n\n\n\n**含义**：这是中文解释。`,
    );
    expect(blockColumns(target, "parallel")).toEqual({
      english: `\n\n${formula}\n\n`,
      chinese: "**含义**：这是中文解释。",
    });
  });

  it("keeps a leading Chinese label above the formula instead of stranding it", () => {
    const target = block(`\n${formula}\n\n (1)`, labelled(`\n${formula}`));
    expect(blockColumns(target, "parallel")).toEqual({
      english: null,
      chinese: labelled(`\n${formula}`),
    });
    const rendered = blockColumns(target, "parallel").chinese ?? "";
    const labelAt = rendered.indexOf("公式（符号保持不变）：");
    const formulaAt = rendered.indexOf("$$");
    expect(labelAt).toBeGreaterThanOrEqual(0);
    expect(labelAt).toBeLessThan(formulaAt);
  });

  it("keeps a genuinely different Chinese formula in its own column", () => {
    const target = block(`\n${formula}\n`, `\n${other}\n\n**含义**：不同公式。`);
    expect(blockColumns(target, "parallel")).toEqual({
      english: target.english,
      chinese: target.chinese,
    });
  });

  it("never collapses an equation block without display math", () => {
    const target = block("见上式。", "见上式。");
    expect(blockColumns(target, "parallel")).toEqual({ english: target.english, chinese: target.chinese });
  });

  it("never rewrites paragraph blocks", () => {
    const target = block(`see ${formula}`, `见 ${formula}`, "paragraph");
    expect(blockColumns(target, "parallel")).toEqual({ english: target.english, chinese: target.chinese });
  });

  it("keeps the full text in each single-language mode", () => {
    const target = block(`\n\n${formula}\n\n`, `\n\n${formula}\n\n\n\n**含义**：这是中文解释。`);
    expect(blockColumns(target, "english")).toEqual({ english: target.english, chinese: null });
    expect(blockColumns(target, "chinese")).toEqual({ english: null, chinese: target.chinese });
  });
});

/** Every `equation` block in the shipped library, with its section id. */
async function loadEquationBlocks(): Promise<[string, PaperBlock][]> {
  const dir = join(process.cwd(), "app/data/papers");
  const found: [string, PaperBlock][] = [];
  for (const slug of readdirSync(dir).sort()) {
    const path = join(dir, slug, "paper.ts");
    if (!existsSync(path)) continue;
    const loaded = (await import(/* @vite-ignore */ path)) as Record<string, unknown>;
    for (const value of Object.values(loaded)) {
      if (!Array.isArray(value)) continue;
      for (const section of value as { id: string; blocks?: PaperBlock[] }[]) {
        for (const candidate of section.blocks ?? []) {
          if (candidate.kind === "equation") found.push([`${slug}/${section.id}/${candidate.id}`, candidate]);
        }
      }
    }
  }
  return found;
}

describe("library-wide equation layout", () => {
  it("never draws the same formula twice in parallel mode", async () => {
    const offenders: string[] = [];
    for (const [where, target] of await loadEquationBlocks()) {
      const columns = blockColumns(target, "parallel");
      const drawn = [...(columns.english ? displayFormulas(columns.english) : []), ...(columns.chinese ? displayFormulas(columns.chinese) : [])];
      const shared = displayFormulas(target.english).filter((f) => displayFormulas(target.chinese).includes(f));
      for (const tex of shared) {
        if (drawn.filter((d) => d === tex).length > 1) offenders.push(`${where}: ${tex.slice(0, 50)}`);
      }
    }
    expect(offenders.join("\n")).toBe("");
  });

  it("drops no prose when it collapses a block to one column", async () => {
    const offenders: string[] = [];
    for (const [where, target] of await loadEquationBlocks()) {
      const columns = blockColumns(target, "parallel");
      if (columns.english && columns.chinese) continue;
      const kept = [columns.english ?? "", columns.chinese ?? ""].join("\n");
      // Every paragraph the hidden column held must still be readable somewhere.
      const hidden = columns.english ? target.chinese : target.english;
      for (const paragraph of hidden.split("\n\n")) {
        const text = paragraph.replace(/\$\$[\s\S]+?\$\$/g, "").trim();
        if (!text || text === " (1)") continue;
        if (!kept.includes(text)) offenders.push(`${where}: ${text.slice(0, 60)}`);
      }
    }
    expect(offenders.join("\n")).toBe("");
  });
});
