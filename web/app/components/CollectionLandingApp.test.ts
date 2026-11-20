import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("collection landing page", () => {
  it("opens the searchable paper index without an intermediate shelf", () => {
    const page = readFileSync("app/page.tsx", "utf8");
    const component = readFileSync(
      "app/components/PaperIndexApp.tsx",
      "utf8",
    );

    expect(page).toContain("PaperIndexApp");
    expect(component).toContain("按主题筛选");
    expect(component).toContain('useState<"list" | "cards">("list")');
    expect(component).toContain('href={withBasePath(paper.href)}');
    expect(component).toContain("READ_PAPERS_STORAGE_KEY");
    expect(component).toContain("<PaperCard");
    expect(component).toContain("formatPublicationLabel(paper.publication)");
    expect(component).toContain('role="status"');
  });
});
