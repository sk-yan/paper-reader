import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { teachAndGrowMentoredReportMarkdown } from "../data/papers/teach-and-grow/report";

describe("PaperReaderApp image lightbox integration", () => {
  it("opens the mentor report by default and preserves source bookmark handling", () => {
    const source = readFileSync("app/components/PaperReaderApp.tsx", "utf8");
    expect(source).toContain('useState<ReaderView>("report")');
    expect(source).toContain('aria-label="阅读模式"');
    expect(source).toContain('window.addEventListener("hashchange", followHash)');
    expect(source).toContain('setReaderView(isReport ? "report" : "paper")');
    expect(source).toContain("if (!stateLoaded) return;");
    expect(source).not.toContain('import Link from "next/link"');
    expect(source).toContain('href={withBasePath("/")}');
  });
  it("connects report Markdown images to the same accessible lightbox", () => {
    const source = readFileSync("app/components/PaperReaderApp.tsx", "utf8");
    expect(source).toContain("img: ({ src, alt })");
    expect(source).toContain('alt || "报告图片"');
    expect(source.match(/onOpenImage=\{setActiveImage\}/g)).toHaveLength(2);
  });
  it("makes figure thumbnails accessible buttons and mounts one shared lightbox", () => {
    const source = readFileSync("app/components/PaperReaderApp.tsx", "utf8");
    expect(source).toContain("onOpenImage");
    expect(source).toContain("放大查看：${block.imageAlt || block.label || \"论文图片\"}");
    expect(source).toContain("event.stopPropagation()");
    expect(source).toContain("<PaperImageLightbox");
  });

  it("shows the registered venue in the paper masthead", () => {
    const source = readFileSync("app/components/PaperReaderApp.tsx", "utf8");

    expect(source).toContain("reader-publication");
    expect(source).toContain("formatPublicationLabel(publication)");
  });

  it("shows the official repository in the masthead only when registered", () => {
    const source = readFileSync("app/components/PaperReaderApp.tsx", "utf8");

    expect(source).toContain("libraryPaper?.codeUrl");
    expect(source).toContain("reader-code-link");
    expect(source).not.toContain("代码未公开");
  });

  it("renders mentor explanations as distinct report callouts", () => {
    const source = readFileSync("app/components/PaperReaderApp.tsx", "utf8");
    const styles = readFileSync("app/globals.css", "utf8");

    expect(source).toContain("mentor-note");
    expect(styles).toContain(".report-markdown .mentor-note");
    expect(source).toContain("appendChapterMentorNotes");
    expect(source).toContain("mentorGuides[paperMeta.slug]");
  });

  it("adds plain-language mentor explanations throughout Teach-and-Grow", () => {
    const report = readFileSync(
      "app/data/papers/teach-and-grow/report.ts",
      "utf8",
    );
    const mentorNotes = report.match(/> \*\*导师解读\*\*：/g) ?? [];

    expect(mentorNotes.length).toBeGreaterThanOrEqual(13);
    expect(report).toContain("### 5.2 Agent-led skill induction");
    expect(report).toContain("这一节可以把它理解为");
    expect(
      teachAndGrowMentoredReportMarkdown.match(/> \*\*导师解读\*\*：/g),
    ).toHaveLength(24);
    expect(teachAndGrowMentoredReportMarkdown).toContain(
      "输出是共享策略和最小可支持 scope。范围只有在出现姿态",
    );
    expect(teachAndGrowMentoredReportMarkdown).toContain(
      "这一节可以把它理解为“从几次不完全一致的示范里找共同规律”",
    );
  });
});
