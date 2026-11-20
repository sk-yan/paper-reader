import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { discoveryDigests } from "../data/discovery";
import { filterDiscoveryPapers } from "./discovery";
import { libraryPapers } from "../data/library";

describe("public daily discovery", () => {
  it("registers every dated JSON exactly once in newest-first order", () => {
    const dates = discoveryDigests.map((digest) => digest.date);
    expect(dates.length).toBeGreaterThan(0);
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).toEqual([...dates].sort().reverse());
    expect([...dates].sort()).toEqual(readdirSync("app/data/discovery").filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map((name) => name.slice(0, -5)).sort());
  });
  it("keeps candidate counts separate from completed readings", () => {
    const digest = discoveryDigests.find((item) => item.date === "2026-11-20")!;
    expect(digest.candidates).toHaveLength(44);
    expect(digest.updates).toHaveLength(2);
    expect(libraryPapers).toHaveLength(18);
  });
  for (const digest of discoveryDigests) {
    it(`${digest.date}: validates IDs, dates, priorities, and public-only text`, () => {
      expect(digest.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const ids = digest.candidates.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const p of digest.candidates) {
        expect(p.url).toMatch(/^https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}v\d+$/);
        expect(p.published >= digest.windowStart && p.published <= digest.windowEnd).toBe(true);
        expect(p.topics.length).toBeGreaterThan(0);
      }
      for (const p of digest.updates) {
        expect(ids).not.toContain(p.id);
        expect(p.published < digest.windowStart).toBe(true);
        expect(p.updated >= digest.windowStart && p.updated <= digest.windowEnd).toBe(true);
      }
      for (const pick of digest.priorities) expect(ids).toContain(pick.id);
      const text = JSON.stringify(digest);
      expect(text).not.toMatch(/\/Users\/|file:\/\/|github_pat_|BEGIN\sPRIVATE\sKEY/);
      expect(digest.reportMarkdown + digest.appendixMarkdown).not.toMatch(/!\[[^\]]*\]\(|<img\b|\]\([^)]*\.md\)/i);
      expect(text).not.toContain("不推送GitHub或发布网站");
    });
  }
  it("composes topic and keyword filters without duplicates", () => {
    const papers = discoveryDigests.find((d) => d.date === "2026-11-20")!.candidates;
    expect(filterDiscoveryPapers(papers, "CoachSI", "all").map((p) => p.id)).toEqual(["2611.25529"]);
    expect(filterDiscoveryPapers(papers, "CoachSI", "agent-memory")).toEqual([]);
    expect(filterDiscoveryPapers(papers, "", "rsi")).toHaveLength(10);
    expect(filterDiscoveryPapers(papers, "  2611.25134  ", "all")).toHaveLength(1);
    expect(filterDiscoveryPapers(papers, "missing-paper", "all")).toEqual([]);
  });
  it("exports dated pages and exposes a basePath-aware discovery entry", () => {
    expect(readFileSync("app/discovery/[date]/page.tsx", "utf8")).toContain("generateStaticParams");
    expect(readFileSync("app/components/PaperIndexApp.tsx", "utf8")).toContain('withBasePath("/discovery/")');
  });
});
