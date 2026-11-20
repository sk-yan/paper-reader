import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Latent Reasoning shelf", () => {
  it("has an independent scoped route and a truthful empty state", () => {
    const route = readFileSync("app/collections/latent-reasoning/page.tsx", "utf8");
    const shelf = readFileSync("app/components/PaperIndexApp.tsx", "utf8");
    expect(route).toContain('item.slug === "latent-reasoning"');
    expect(route).toContain('initialCollection={collection.slug}');
    expect(route).toContain("Latent Reasoning | Paper Atlas");
    expect(shelf).toContain("这个主题还没有论文");
    expect(shelf).toContain("查看全部论文");
    expect(shelf).toContain("<CreatePaperDialog collection={selectedCollection}");
    expect(shelf).not.toContain('href="/papers/worldevolver"');
  });
});
