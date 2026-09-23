"use client";

import {
  Children,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { paperMathOptions, rehypePaperMathCompatibility } from "../lib/math-options";
import { blockColumns } from "../lib/equation-blocks";
import {
  PaperImageLightbox,
  type LightboxImage,
} from "./PaperImageLightbox";
import type {
  PaperBlock,
  PaperSection,
  ReaderPaperMeta,
} from "../lib/content";
import {
  evidenceTargets as defaultEvidenceTargets,
  resolveEvidenceTarget,
} from "../lib/report-links";
import {
  DEFAULT_READING_STATE,
  type LanguageMode,
  parseReadingState,
  serializeReadingState,
} from "../lib/reading-state";
import {
  buildSearchIndex,
  searchRecords,
  type SearchResult,
} from "../lib/search";
import { libraryPapers } from "../data/library";
import { contentRights } from "../data/content-rights";
import { mentorGuides } from "../data/mentor-guides";
import { formatPublicationLabel } from "../lib/library";
import { appendChapterMentorNotes } from "../lib/mentor-notes";
import { withBasePath } from "../lib/site-url";

const markdownUrlTransform = (url: string) => withBasePath(defaultUrlTransform(url));

type Props = {
  paperMeta: ReaderPaperMeta;
  sections: PaperSection[];
  reportMarkdown: string;
  evidenceTargets?: Record<string, string>;
};

type MobilePane = "paper" | "report";

const STORAGE_KEY = "worldevolver-reader:v1";

const SOURCE_LABELS = {
  "paper-en": "论文 EN",
  "paper-zh": "论文中文",
  report: "精读报告",
};

function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode };
    return plainText(props.children);
  }
  return "";
}

function EvidenceText({
  children,
  onJump,
  evidenceTargets,
}: {
  children: ReactNode;
  onJump: (target: string) => void;
  evidenceTargets: Record<string, string>;
}) {
  const labels = useMemo(
    () => Object.keys(evidenceTargets).sort((a, b) => b.length - a.length),
    [evidenceTargets],
  );
  const pattern = useMemo(
    () =>
      new RegExp(
        `(${labels
          .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")})`,
        "g",
      ),
    [labels],
  );

  if (labels.length === 0) return children;

  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    return child.split(pattern).map((part, index) => {
      const target =
        evidenceTargets[part] ??
        (evidenceTargets === defaultEvidenceTargets
          ? resolveEvidenceTarget(part)
          : null);
      if (!target) return part;
      return (
        <button
          className="evidence-chip"
          key={`${part}-${index}`}
          onClick={() => onJump(target)}
          type="button"
        >
          {part}
        </button>
      );
    });
  });
}

function Markdown({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown
        urlTransform={markdownUrlTransform}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypePaperMathCompatibility, [rehypeKatex, paperMathOptions]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function PaperBlockView({
  block,
  mode,
  pinned,
  flash,
  onPin,
  onOpenImage,
}: {
  block: PaperBlock;
  mode: LanguageMode;
  pinned: boolean;
  flash: boolean;
  onPin: (id: string) => void;
  onOpenImage: (image: LightboxImage) => void;
}) {
  const imageSrc = block.imageSrc ? withBasePath(block.imageSrc) : undefined;
  const columns = blockColumns(block, mode);
  const singleColumn = !columns.english || !columns.chinese;
  return (
    <article
      className={`paper-block paper-block--${block.kind}${
        singleColumn ? " is-single-column" : ""
      }${pinned ? " is-pinned" : ""}${flash ? " is-flashing" : ""}`}
      data-block-id={block.id}
      id={block.id}
      onClick={() => onPin(block.id)}
    >
      <div className="paper-block__meta">
        <span>{block.label}</span>
        <span>{block.kind}</span>
      </div>
      {imageSrc && (
        <button
          aria-label={`放大查看：${block.imageAlt || block.label || "论文图片"}`}
          className="paper-block__figure"
          onClick={(event) => {
            event.stopPropagation();
            onOpenImage({
              src: imageSrc,
              alt: block.imageAlt || block.label || "论文图片",
            });
          }}
          type="button"
        >
          <img alt={block.imageAlt || block.label || ""} src={imageSrc} />
        </button>
      )}
      {columns.english !== null && (
        <div className="paper-block__en" lang="en">
          <Markdown>{columns.english}</Markdown>
        </div>
      )}
      {columns.chinese !== null && (
        <div className="paper-block__zh" lang="zh-CN">
          <Markdown>{columns.chinese}</Markdown>
        </div>
      )}
    </article>
  );
}

function ReportContent({
  markdown,
  onJump,
  evidenceTargets,
  onOpenImage,
}: {
  markdown: string;
  onJump: (target: string) => void;
  evidenceTargets: Record<string, string>;
  onOpenImage: (image: LightboxImage) => void;
}) {
  return (
    <div className="markdown report-markdown">
      <ReactMarkdown
        urlTransform={markdownUrlTransform}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypePaperMathCompatibility, [rehypeKatex, paperMathOptions]]}
        components={{
          img: ({ src, alt }) => typeof src === "string" && src ? (
            <button
              type="button"
              className="paper-block__figure"
              aria-label={`放大查看：${alt || "报告图片"}`}
              onClick={() => onOpenImage({ src, alt: alt || "报告图片" })}
            >
              <img src={src} alt={alt || "报告图片"} />
            </button>
          ) : null,
          h2: ({ children }) => {
            const label = plainText(children);
            const number = label.match(/^(\d+)\./)?.[1];
            return <h2 id={number ? `report-${number}` : undefined}>{children}</h2>;
          },
          blockquote: ({ children }) => {
            const label = plainText(children).trim();
            return (
              <blockquote
                className={label.startsWith("导师解读") ? "mentor-note" : undefined}
              >
                {children}
              </blockquote>
            );
          },
          p: ({ children }) => (
            <p>
              <EvidenceText
                evidenceTargets={evidenceTargets}
                onJump={onJump}
              >
                {children}
              </EvidenceText>
            </p>
          ),
          li: ({ children }) => (
            <li>
              <EvidenceText
                evidenceTargets={evidenceTargets}
                onJump={onJump}
              >
                {children}
              </EvidenceText>
            </li>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export function PaperReaderApp({
  paperMeta,
  sections,
  reportMarkdown,
  evidenceTargets = defaultEvidenceTargets,
}: Props) {
  const [splitPercent, setSplitPercent] = useState(
    DEFAULT_READING_STATE.splitPercent,
  );
  const [languageMode, setLanguageMode] = useState<LanguageMode>("parallel");
  const [collapsedSections, setCollapsedSections] = useState<string[]>(
    DEFAULT_READING_STATE.collapsedSections,
  );
  const [activePaperSection, setActivePaperSection] = useState("frontmatter");
  const [activeReportSection, setActiveReportSection] = useState("report-1");
  const [pinnedBlock, setPinnedBlock] = useState("");
  const [flashBlock, setFlashBlock] = useState("");
  const [mobilePane, setMobilePane] = useState<MobilePane>("paper");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const [activeImage, setActiveImage] = useState<LightboxImage | null>(null);
  const paperScrollRef = useRef<HTMLDivElement>(null);
  const reportScrollRef = useRef<HTMLDivElement>(null);
  const libraryPaper = useMemo(
    () => libraryPapers.find((paper) => paper.slug === paperMeta.slug),
    [paperMeta.slug],
  );
  const publication = libraryPaper?.publication;
  const rights = contentRights[paperMeta.slug];
  if (rights?.decision !== "include") evidenceTargets = {};
  const enrichedReportMarkdown = useMemo(
    () =>
      appendChapterMentorNotes(
        reportMarkdown,
        mentorGuides[paperMeta.slug],
      ),
    [paperMeta.slug, reportMarkdown],
  );

  const reportSections = useMemo(() => {
    return Array.from(enrichedReportMarkdown.matchAll(/^## (\d+)\. (.+)$/gm)).map(
      (match) => ({
        id: `report-${match[1]}`,
        number: match[1],
        title: match[2],
      }),
    );
  }, [enrichedReportMarkdown]);

  const searchIndex = useMemo(
    () => buildSearchIndex(sections, enrichedReportMarkdown),
    [enrichedReportMarkdown, sections],
  );
  const searchResults = useMemo(
    () => searchRecords(searchIndex, query),
    [searchIndex, query],
  );
  const blockToSection = useMemo(() => {
    return new Map(
      sections.flatMap((section) =>
        section.blocks.map((block) => [block.id, section.id] as const),
      ),
    );
  }, [sections]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const state = parseReadingState(
        localStorage.getItem(`${STORAGE_KEY}:${paperMeta.slug}`),
      );
      setSplitPercent(state.splitPercent);
      setLanguageMode(state.languageMode);
      setCollapsedSections(state.collapsedSections);
      setPinnedBlock(state.paperBlockId);
      setActiveReportSection(state.reportSectionId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [paperMeta.slug]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}:${paperMeta.slug}`,
        serializeReadingState({
          splitPercent,
          languageMode,
          paperBlockId: pinnedBlock || "abstract",
          reportSectionId: activeReportSection,
          collapsedSections,
        }),
      );
    } catch {
      // The reader remains fully functional without local persistence.
    }
  }, [
    activeReportSection,
    collapsedSections,
    languageMode,
    pinnedBlock,
    paperMeta.slug,
    splitPercent,
  ]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        if (activeImage) {
          setActiveImage(null);
        } else if (searchOpen) {
          setSearchOpen(false);
          setQuery("");
        } else {
          setPinnedBlock("");
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImage, searchOpen]);

  useEffect(() => {
    const root = paperScrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id.startsWith("paper-section-")) {
          setActivePaperSection(
            visible.target.id.replace("paper-section-", ""),
          );
        }
      },
      { root, rootMargin: "-12% 0px -68% 0px", threshold: [0.08, 0.2] },
    );
    root
      .querySelectorAll<HTMLElement>(".paper-section")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [collapsedSections]);

  useEffect(() => {
    const root = reportScrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id.startsWith("report-")) {
          setActiveReportSection(visible.target.id);
        }
      },
      { root, rootMargin: "-10% 0px -78% 0px", threshold: 0 },
    );
    root
      .querySelectorAll<HTMLElement>("h2[id^='report-']")
      .forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [enrichedReportMarkdown]);

  const setCollapsed = (sectionId: string, collapsed: boolean) => {
    setCollapsedSections((current) => {
      if (collapsed) return Array.from(new Set([...current, sectionId]));
      return current.filter((id) => id !== sectionId);
    });
  };

  const jumpToPaper = (target: string) => {
    const sectionId = blockToSection.get(target);
    if (sectionId) setCollapsed(sectionId, false);
    setMobilePane("paper");
    setFlashBlock(target);
    window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      window.history.replaceState(null, "", `#${target}`);
    }, 40);
    window.setTimeout(() => setFlashBlock(""), 900);
  };

  const jumpToPaperSection = (sectionId: string) => {
    setCollapsed(sectionId, false);
    setMobilePane("paper");
    window.setTimeout(() => {
      document
        .getElementById(`paper-section-${sectionId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const jumpToReport = (sectionId: string) => {
    setMobilePane("report");
    setActiveReportSection(sectionId);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 40);
  };

  const onSearchResult = (result: SearchResult) => {
    setSearchOpen(false);
    setQuery("");
    if (result.source === "report") jumpToReport(result.id);
    else jumpToPaper(result.id);
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;
    const start = splitPercent;
    const width = window.innerWidth;
    const onMove = (move: PointerEvent) => {
      const next = start + ((move.clientX - startX) / width) * 100;
      setSplitPercent(Math.min(78, Math.max(48, next)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onSeparatorKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setSplitPercent((current) =>
      Math.min(
        78,
        Math.max(48, current + (event.key === "ArrowRight" ? 2 : -2)),
      ),
    );
  };

  return (
    <main className="reader-app">
      <header className="topbar">
        <Link
          aria-label="返回论文精读库"
          className="brand"
          href="/"
        >
          <span className="brand__mark">←</span>
          <span className="brand__copy">
            <strong>返回 Paper Atlas</strong>
            <small>{paperMeta.readerLabel}</small>
          </span>
        </Link>

        <nav className="topbar__nav" aria-label="阅读导航">
          <button onClick={() => jumpToPaper("abstract")} type="button">
            论文
          </button>
          <button onClick={() => jumpToReport("report-1")} type="button">
            精读报告
          </button>
          <button onClick={() => jumpToReport("report-11")} type="button">
            复现
          </button>
          <a href={withBasePath(paperMeta.pdfHref)} target="_blank" rel="noreferrer">
            PDF ↗
          </a>
        </nav>

        <div className="topbar__actions">
          <div className="mode-control" aria-label="语言显示模式">
            {(
              [
                ["parallel", "对照"],
                ["english", "EN"],
                ["chinese", "中文"],
              ] as const
            ).map(([value, label]) => (
              <button
                aria-pressed={languageMode === value}
                className={languageMode === value ? "is-active" : ""}
                key={value}
                onClick={() => setLanguageMode(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            aria-label="搜索论文和报告"
            className="search-trigger"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            搜索 <kbd>⌘K</kbd>
          </button>
          <div className="progress-label" aria-label={`论文阅读进度 ${progress}%`}>
            <span style={{ "--progress": `${progress}%` } as React.CSSProperties} />
            {progress}%
          </div>
        </div>
      </header>

      <div className="mobile-switch" aria-label="移动端阅读区域">
        <button
          className={mobilePane === "paper" ? "is-active" : ""}
          onClick={() => setMobilePane("paper")}
          type="button"
        >
          论文 · 中英对照
        </button>
        <button
          className={mobilePane === "report" ? "is-active" : ""}
          onClick={() => setMobilePane("report")}
          type="button"
        >
          精读报告
        </button>
      </div>

      <section
        className="reader-shell"
        data-mobile-pane={mobilePane}
        style={{ "--paper-width": `${splitPercent}%` } as React.CSSProperties}
      >
        <section className="pane paper-pane" aria-label="双语论文">
          <div className="pane-header">
            <div>
              <span className="eyebrow">PAPER · BILINGUAL SOURCE</span>
              <strong>英文原文 / 中文翻译</strong>
            </div>
            <span className="translation-note">
              AI 辅助翻译 · 以英文原文为准
            </span>
          </div>
          <div className="paper-layout">
            <aside className="paper-toc" aria-label="论文目录">
              <span className="toc-label">CONTENTS</span>
              {sections.map((section) => (
                <button
                  className={
                    activePaperSection === section.id ? "is-active" : ""
                  }
                  key={section.id}
                  onClick={() => jumpToPaperSection(section.id)}
                  type="button"
                >
                  <span>{section.number || "·"}</span>
                  <span>{section.titleZh}</span>
                </button>
              ))}
            </aside>

            <div
              className={`paper-scroll mode-${languageMode}`}
              onScroll={(event) => {
                const element = event.currentTarget;
                const max = element.scrollHeight - element.clientHeight;
                setProgress(max > 0 ? Math.round((element.scrollTop / max) * 100) : 0);
              }}
              ref={paperScrollRef}
            >
              <div className="paper-masthead">
                <span className="eyebrow">
                  {paperMeta.eyebrow}
                </span>
                <div className="reader-resources">
                  {publication ? (
                    <a
                      className={`reader-publication reader-publication--${publication.status} reader-publication--${publication.kind}`}
                      href={publication.url}
                      rel="noreferrer"
                      target="_blank"
                      title={publication.note}
                    >
                      <i aria-hidden="true" />
                      {formatPublicationLabel(publication)}
                    </a>
                  ) : null}
                  {libraryPaper?.codeUrl ? (
                    <a
                      aria-label={`${paperMeta.title} 官方 GitHub 仓库`}
                      className="reader-code-link"
                      href={libraryPaper.codeUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span aria-hidden="true">&lt;/&gt;</span>
                      GitHub ↗
                    </a>
                  ) : null}
                </div>
                <h1>{paperMeta.title}</h1>
                <p className="authors">
                  {paperMeta.authors}
                </p>
                <p className="affiliations">
                  {paperMeta.affiliations}
                </p>
                {rights ? <p className="affiliations">
                  {rights.decision === "include"
                    ? `原文、图表与译文遵循 ${rights.license_id}；翻译和裁切属于改编，不代表作者认可。`
                    : "公开版仅提供原创导师报告；全文、译文与原图未随仓库转载。个人完整版不受影响。"}
                  {" "}<a href={rights.source_url} target="_blank" rel="noreferrer">官方原文</a>
                  {" · "}<a href={rights.license_url} target="_blank" rel="noreferrer">查看许可</a>
                </p> : null}
                <div className="paper-status">
                  <span>{paperMeta.pageCount} PAGES</span>
                  <span>{sections.reduce((sum, section) => sum + section.blocks.length, 0)} ALIGNED BLOCKS</span>
                  <span>13 REPORT CHAPTERS</span>
                </div>
              </div>

              {sections.map((section) => {
                const collapsed = collapsedSections.includes(section.id);
                return (
                  <section
                    className="paper-section"
                    id={`paper-section-${section.id}`}
                    key={section.id}
                  >
                    <button
                      aria-expanded={!collapsed}
                      className="paper-section__heading"
                      onClick={() => setCollapsed(section.id, !collapsed)}
                      type="button"
                    >
                      <span className="paper-section__number">
                        {section.number || "§"}
                      </span>
                      <span>
                        <strong>{section.titleEn}</strong>
                        <small>{section.titleZh}</small>
                      </span>
                      <span className="paper-section__toggle">
                        {collapsed ? "展开 +" : "收起 −"}
                      </span>
                    </button>
                    {!collapsed && (
                      <div className="paper-section__blocks">
                        {section.blocks.map((block) => (
                          <PaperBlockView
                            block={block}
                            flash={flashBlock === block.id}
                            key={block.id}
                            mode={languageMode}
                            onPin={(id) =>
                              setPinnedBlock((current) =>
                                current === id ? "" : id,
                              )
                            }
                            onOpenImage={setActiveImage}
                            pinned={pinnedBlock === block.id}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </section>

        <div
          aria-label="调整论文与报告的宽度"
          aria-orientation="vertical"
          aria-valuemax={78}
          aria-valuemin={48}
          aria-valuenow={Math.round(splitPercent)}
          className="splitter"
          onKeyDown={onSeparatorKey}
          onPointerDown={startResize}
          role="separator"
          tabIndex={0}
        >
          <span />
        </div>

        <section className="pane report-pane" aria-label="中文精读报告">
          <div className="pane-header pane-header--report">
            <div>
              <span className="eyebrow">MENTOR NOTES · EVIDENCE BOUND</span>
              <strong>论文精读报告</strong>
            </div>
            <span className="report-count">13 CHAPTERS</span>
          </div>
          <div className="report-toc" aria-label="精读报告目录">
            {reportSections.map((section) => (
              <button
                className={
                  activeReportSection === section.id ? "is-active" : ""
                }
                key={section.id}
                onClick={() => jumpToReport(section.id)}
                title={section.title}
                type="button"
              >
                {section.number.padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="report-scroll" ref={reportScrollRef}>
              <ReportContent
                onOpenImage={setActiveImage}
              evidenceTargets={evidenceTargets}
              markdown={enrichedReportMarkdown}
              onJump={jumpToPaper}
            />
          </div>
        </section>
      </section>

      {searchOpen && (
        <div
          aria-label="搜索论文与报告"
          aria-modal="true"
          className="search-overlay"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSearchOpen(false);
          }}
          role="dialog"
        >
          <div className="search-palette">
            <div className="search-palette__input">
              <span>⌕</span>
              <input
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索英文、中文翻译或精读报告…"
                value={query}
              />
              <kbd>ESC</kbd>
            </div>
            <div className="search-palette__meta">
              <span>LOCAL SEARCH · NO UPLOAD</span>
              <span>{query ? `${searchResults.length} RESULTS` : "TYPE TO SEARCH"}</span>
            </div>
            <div className="search-results">
              {query && !searchResults.length && (
                <div className="search-empty">
                  <strong>没有找到结果</strong>
                  <span>试试模块名、数据集、公式符号或中文概念。</span>
                </div>
              )}
              {searchResults.map((result) => (
                <button
                  key={`${result.source}-${result.id}`}
                  onClick={() => onSearchResult(result)}
                  type="button"
                >
                  <span className={`source-badge source-badge--${result.source}`}>
                    {SOURCE_LABELS[result.source]}
                  </span>
                  <strong>{result.label}</strong>
                  <p>{result.excerpt}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeImage && (
        <PaperImageLightbox
          image={activeImage}
          key={activeImage.src}
          onClose={() => setActiveImage(null)}
        />
      )}
    </main>
  );
}
