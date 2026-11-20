import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { researchFocus } from "./research-focus";
import { paperCollections } from "./collections";
import { libraryPapers } from "./library";
import { cataloguePapers } from "../lib/catalogue";

describe("active research focus", () => {
  it("tracks the five requested topics without latent reasoning", () => {
    expect(researchFocus.map((topic) => topic.slug)).toEqual([
      "world-models", "robotics", "agent-memory", "rsi", "world-action-models",
    ]);
    expect(researchFocus.find((topic) => topic.slug === "rsi")?.titleEn).toBe("Recursive Self-Improvement");
    expect(researchFocus.every((topic) => topic.keywords.length > 0)).toBe(true);
  });
  it("archives the old topic without removing its route or hiding historical papers", () => {
    expect(paperCollections.find((topic) => topic.slug === "latent-reasoning")?.archived).toBe(true);
    expect(readFileSync("app/collections/latent-reasoning/page.tsx", "utf8")).toContain("initialCollection={collection.slug}");
    const historical = { ...libraryPapers[0], collection: "latent-reasoning" };
    expect(cataloguePapers([historical], { query: "", collection: "all", status: "all", read: "all" }, new Set())).toEqual([historical]);
    expect(libraryPapers).toHaveLength(18);
  });
});
