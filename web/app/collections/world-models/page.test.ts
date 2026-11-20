import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("World Models collection route", () => {
  it("keeps the old URL as a prefiltered directory with all topics available", () => {
    const source = readFileSync(
      "app/collections/world-models/page.tsx",
      "utf8",
    );

    expect(source).toContain(
      'item.slug === "world-models"',
    );
    expect(source).toContain('initialCollection={collection.slug}');
    expect(source).toContain("papers={libraryPapers}");
    expect(source).toContain("PaperIndexApp");
  });
});
