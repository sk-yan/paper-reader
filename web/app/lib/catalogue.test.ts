import { describe, expect, it } from "vitest";
import { cataloguePapers } from "./catalogue";
import { libraryPapers } from "../data/library";

const filters = { query: "", collection: "all", status: "all", read: "all" } as const;

describe("content-first catalogue", () => {
  it("includes all papers, sorted by date without mutating source data", () => {
    const before = [...libraryPapers];
    const actual = cataloguePapers(libraryPapers, filters, new Set());
    expect(actual).toHaveLength(18);
    expect(actual.map((p) => p.updatedAt)).toEqual(actual.map((p) => p.updatedAt).sort().reverse());
    expect(libraryPapers).toEqual(before);
  });
  it("composes keyword, topic, workflow, and personal-read filters", () => {
    const read = new Set(["worldevolver"]);
    expect(cataloguePapers(libraryPapers, { ...filters, query: "WorldEvolver", collection: "world-models", status: "completed", read: "read" }, read).map((p) => p.slug)).toEqual(["worldevolver"]);
    expect(cataloguePapers(libraryPapers, { ...filters, query: "WorldEvolver", read: "unread" }, read)).toEqual([]);
    expect(cataloguePapers(libraryPapers, { ...filters, status: "queued" }, read)).toEqual([]);
    expect(cataloguePapers(libraryPapers, { ...filters, read: "unread" }, read)).toHaveLength(17);
  });
  it("keeps an empty topic empty instead of displaying unrelated papers", () => {
    expect(cataloguePapers(libraryPapers, { ...filters, collection: "latent-reasoning" }, new Set())).toEqual([]);
    expect(cataloguePapers(libraryPapers, { ...filters, query: "nonexistent-paper" }, new Set())).toEqual([]);
  });
});
