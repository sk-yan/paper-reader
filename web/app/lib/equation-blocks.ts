import type { PaperBlock } from "./content";
import type { LanguageMode } from "./reading-state";

const DISPLAY_MATH = /\$\$([\s\S]+?)\$\$/g;

/** Whitespace-insensitive form, so reflowed source still compares equal. */
function normalise(tex: string): string {
  return tex.replace(/\s+/g, " ").trim();
}

/** Every `$$...$$` formula in a block field, in document order. */
export function displayFormulas(markdown: string): string[] {
  return [...markdown.matchAll(DISPLAY_MATH)].map((match) => normalise(match[1]));
}

/**
 * An `equation` block normally repeats its formulas in both columns, because a
 * formula is language-neutral and each column has to stand on its own in
 * single-language mode. In parallel mode that is what draws the same formula
 * twice.
 */
function repeatsFormulasOf(block: PaperBlock, formulas: string[]): boolean {
  if (block.kind !== "equation" || formulas.length === 0) return false;
  const chinese = displayFormulas(block.chinese);
  return (
    chinese.length === formulas.length &&
    formulas.every((formula, index) => formula === chinese[index])
  );
}

/**
 * The column text with the given formulas removed, or null when the formulas
 * were all it held.
 */
function withoutFormulas(markdown: string, formulas: string[]): string | null {
  let seen = 0;
  const stripped = markdown.replace(DISPLAY_MATH, (whole, tex: string) => {
    if (seen < formulas.length && normalise(tex) === formulas[seen]) {
      seen += 1;
      return "";
    }
    return whole;
  });
  return stripped.trim() ? stripped.trim() : null;
}

export type BlockColumns = {
  /** Content for the English column, or null when it should not be rendered. */
  english: string | null;
  /** Content for the Chinese column, or null when it should not be rendered. */
  chinese: string | null;
};

/**
 * Decide what each reading column shows for a block.
 *
 * In parallel mode an `equation` block whose Chinese column repeats the English
 * formulas verbatim is collapsed so the formula is drawn once, while every
 * piece of prose survives:
 *
 * - Chinese column is only a copy of the formulas → draw the English column
 *   alone, full width.
 * - English column is only the formulas → draw them with the remaining Chinese
 *   prose (the `含义` note) beside them.
 * - Both columns carry prose → the English column adds nothing the Chinese one
 *   lacks, so draw the Chinese column verbatim, full width. Subtracting the
 *   formula from the Chinese column instead would strand a leading label such
 *   as `公式（符号保持不变）：` under the formula it introduces.
 *
 * Drawing the same wide `white-space: nowrap` formula twice in one grid row
 * made both copies overflow their half-width cells and collide across the
 * divider. Single-language modes keep the full original text, so a formula is
 * never lost by switching language.
 */
export function blockColumns(block: PaperBlock, mode: LanguageMode): BlockColumns {
  if (mode === "english") return { english: block.english, chinese: null };
  if (mode === "chinese") return { english: null, chinese: block.chinese };

  const formulas = displayFormulas(block.english);
  if (!repeatsFormulasOf(block, formulas)) {
    return { english: block.english, chinese: block.chinese };
  }

  const chineseProse = withoutFormulas(block.chinese, formulas);
  if (!chineseProse) return { english: block.english, chinese: null };

  const englishProse = withoutFormulas(block.english, formulas);
  if (!englishProse) return { english: block.english, chinese: chineseProse };

  return { english: null, chinese: block.chinese };
}
