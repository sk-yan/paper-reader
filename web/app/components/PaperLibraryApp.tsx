"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  countPapersByStatus,
  filterPapers,
  formatPublicationLabel,
  type LibraryFilter,
  type LibraryPaper,
  type PaperCollection,
  type PaperStatus,
} from "../lib/library";
import {
  READ_PAPERS_STORAGE_KEY,
  parseReadPapers,
  serializeReadPapers,
  toggleReadPaper,
} from "../lib/read-papers";
import { CreatePaperDialog } from "./CreatePaperDialog";
import { withBasePath } from "../lib/site-url";

const statusMeta: Record<
  PaperStatus,
  { label: string; shortLabel: string; action: string }
> = {
  completed: {
    label: "已完成",
    shortLabel: "READY",
    action: "进入精读",
  },
  reading: {
    label: "精读中",
    shortLabel: "IN PROGRESS",
    action: "处理中",
  },
  queued: {
    label: "待读",
    shortLabel: "QUEUED",
    action: "等待开始",
  },
};

const filterLabels: Record<LibraryFilter, string> = {
  all: "全部",
  completed: "已完成",
  reading: "精读中",
  queued: "待读",
};

export function PaperCard({
  paper,
  index,
  isRead,
  onToggleRead,
}: {
  paper: LibraryPaper;
  index: number;
  isRead: boolean;
  onToggleRead: (slug: string) => void;
}) {
  const status = statusMeta[paper.status];

  return (
    <article
      className={`library-card library-card--${paper.status}${
        index === 0 ? " library-card--featured" : ""
      }${isRead ? " is-read" : ""}`}
    >
      <div className="library-card__inner">
        <section
          aria-hidden={isRead}
          inert={isRead}
          className="library-card__face library-card__face--front"
        >
          <div className="library-card__topline">
            <span className={`library-status library-status--${paper.status}`}>
              <i aria-hidden="true" />
              {status.label}
            </span>
            <button
              aria-label={`将 ${paper.titleEn} 标记为已读`}
              aria-pressed={isRead}
              className="library-read-toggle"
              onClick={() => onToggleRead(paper.slug)}
              type="button"
            >
              <i aria-hidden="true">✓</i>
              标记已读
            </button>
          </div>

          {paper.isExample ? (
            <span className="library-example">示例任务</span>
          ) : null}

          <div className="library-card__index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="library-card__body">
            <p className="library-card__kicker">
              {paper.year} · {paper.domains[0]}
            </p>
            <div className="library-card__resources">
              <a
                className={`library-publication library-publication--${paper.publication.status} library-publication--${paper.publication.kind}`}
                href={paper.publication.url}
                rel="noreferrer"
                target="_blank"
                title={paper.publication.note}
              >
                <i aria-hidden="true" />
                {formatPublicationLabel(paper.publication)}
              </a>
              {paper.codeUrl ? (
                <a
                  aria-label={`${paper.titleEn} 官方 GitHub 仓库`}
                  className="library-code-link"
                  href={paper.codeUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span aria-hidden="true">&lt;/&gt;</span>
                  GitHub ↗
                </a>
              ) : null}
            </div>
            <h2>{paper.titleEn}</h2>
            <h3>{paper.titleZh}</h3>
            <p className="library-card__authors">{paper.authors}</p>
            <p className="library-card__summary">{paper.summary}</p>
          </div>

          <div className="library-card__domains" aria-label="论文领域">
            {paper.domains.map((domain) => (
              <span key={domain}>{domain}</span>
            ))}
          </div>

          <div className="library-card__progress">
            <div>
              <span>{paper.stage}</span>
              <strong>{paper.progress}%</strong>
            </div>
            <span className="library-progress-track" aria-hidden="true">
              <i style={{ width: `${paper.progress}%` }} />
            </span>
          </div>

          <footer className="library-card__footer">
            <span>更新于 {paper.updatedAt}</span>
            {paper.href ? (
              <a href={withBasePath(paper.href)}>
                {status.action} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="library-card__disabled">{status.action}</span>
            )}
          </footer>
        </section>

        <section
          aria-hidden={!isRead}
          inert={!isRead}
          className="library-card__face library-card__face--back"
        >
          <div className="library-card__back-topline">
            <span>READING ARCHIVE</span>
            <span>{String(index + 1).padStart(2, "0")} / {paper.year}</span>
          </div>

          <div className="library-completion-seal" aria-hidden="true">
            <svg viewBox="0 0 160 160" role="img">
              <circle className="library-completion-seal__orbit" cx="80" cy="80" r="67" />
              <circle className="library-completion-seal__ring" cx="80" cy="80" r="49" />
              <path className="library-completion-seal__check" d="M49 81l20 21 43-48" />
              <path className="library-completion-seal__trail" d="M22 99c20 30 54 44 87 31" />
            </svg>
            <span>READ</span>
          </div>

          <div className="library-card__completion-copy">
            <span>✓ PERSONAL READING MARK</span>
            <h2>已完成阅读</h2>
            <h3>{paper.titleEn}</h3>
            <p>{paper.titleZh}</p>
          </div>

          <div className="library-card__back-actions">
            <button
              aria-label={`取消 ${paper.titleEn} 的已读标记`}
              aria-pressed={isRead}
              onClick={() => onToggleRead(paper.slug)}
              type="button"
            >
              <span aria-hidden="true">↶</span>
              翻回查看
            </button>
            {paper.href ? (
            <a
              aria-label={`进入 ${paper.titleEn} 精读页面`}
              href={withBasePath(paper.href)}
            >
              再读一遍 <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          </div>
        </section>
      </div>
    </article>
  );
}

type PaperLibraryAppProps = {
  papers: LibraryPaper[];
  collection: PaperCollection;
  backHref: string;
};

export function PaperLibraryApp({
  papers,
  collection,
  backHref,
}: PaperLibraryAppProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LibraryFilter>("all");
  const [domain, setDomain] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [readPapers, setReadPapers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReadPapers(
        parseReadPapers(localStorage.getItem(READ_PAPERS_STORAGE_KEY)),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const counts = useMemo(() => countPapersByStatus(papers), [papers]);
  const latestPaper = useMemo(
    () => [...papers].filter(paper => paper.href).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0],
    [papers],
  );
  const domains = useMemo(
    () => Array.from(new Set(papers.flatMap((paper) => paper.domains))),
    [papers],
  );
  const visiblePapers = useMemo(
    () => filterPapers(papers, query, status, domain),
    [domain, papers, query, status],
  );

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setDomain("all");
  };

  const toggleRead = (slug: string) => {
    setReadPapers((current) => {
      const next = toggleReadPaper(current, slug);
      try {
        localStorage.setItem(
          READ_PAPERS_STORAGE_KEY,
          serializeReadPapers(next),
        );
      } catch {
        // Read marking remains available for this session without persistence.
      }
      return next;
    });
  };

  return (
    <main className="library-page">
      <header className="library-nav">
        <Link className="library-brand" href="/">
          <span>PA</span>
          <div>
            <strong>Paper Atlas</strong>
            <small>论文精读库</small>
          </div>
        </Link>
        <nav aria-label="论文库导航">
          <Link href={backHref}>主题导航</Link>
          <a href="#library">本专题论文</a>
          {latestPaper?.href ? <Link href={latestPaper.href}>最近精读</Link> : null}
          <button onClick={() => setIsCreateOpen(true)} type="button">
            ＋ 创建新论文
          </button>
        </nav>
      </header>

      <section className="library-hero library-hero--collection" data-watermark={collection.titleEn.split(" ")[0].toUpperCase()}>
        <div className="library-hero__copy">
          <Link className="library-back-link" href={backHref}>
            ← 返回主题导航
          </Link>
          <span className="library-eyebrow">{collection.eyebrow}</span>
          <h1>
            {collection.titleZh}
            <br />
            <em>{collection.titleEn}</em>
          </h1>
          <p>{collection.description}</p>
          <button onClick={() => setIsCreateOpen(true)} type="button">
            向本专题添加论文 <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="library-hero__manifesto" aria-label="精读流程">
          <span>WORKFLOW · 2026</span>
          <ol>
            <li>
              <b>01</b>
              <p>PDF 解析与结构恢复</p>
            </li>
            <li>
              <b>02</b>
              <p>英文原文与中文逐段对齐</p>
            </li>
            <li>
              <b>03</b>
              <p>13 章证据绑定精读报告</p>
            </li>
          </ol>
          <small>POWERED BY YOUR CODEX WORKFLOW</small>
        </div>
      </section>

      <section className="library-stats" aria-label="论文状态汇总">
        {(
          ["all", "completed", "reading", "queued"] as LibraryFilter[]
        ).map((item) => (
          <button
            aria-pressed={status === item}
            className={status === item ? "is-active" : ""}
            key={item}
            onClick={() => setStatus(item)}
            type="button"
          >
            <strong>{String(counts[item]).padStart(2, "0")}</strong>
            <span>{filterLabels[item]}</span>
          </button>
        ))}
      </section>

      <section className="library-collection" id="library">
        <header className="library-collection__header">
          <div>
            <span className="library-eyebrow">{collection.titleEn}</span>
            <h2>{collection.titleZh} · 论文书架</h2>
          </div>
          <label className="library-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="搜索论文"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、作者或研究方向"
              type="search"
              value={query}
            />
          </label>
        </header>

        <div className="library-filters">
          <div className="library-status-filters" aria-label="按状态筛选">
            {(
              ["all", "completed", "reading", "queued"] as LibraryFilter[]
            ).map((item) => (
              <button
                className={status === item ? "is-active" : ""}
                key={item}
                onClick={() => setStatus(item)}
                type="button"
              >
                {filterLabels[item]}
                <span>{counts[item]}</span>
              </button>
            ))}
          </div>

          <div className="library-domain-filters" aria-label="按领域筛选">
            <button
              className={domain === "all" ? "is-active" : ""}
              onClick={() => setDomain("all")}
              type="button"
            >
              全部领域
            </button>
            {domains.map((item) => (
              <button
                className={domain === item ? "is-active" : ""}
                key={item}
                onClick={() => setDomain(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {visiblePapers.length ? (
          <div className="library-grid">
            {visiblePapers.map((paper, index) => (
              <PaperCard
                index={index}
                isRead={readPapers.has(paper.slug)}
                key={paper.slug}
                onToggleRead={toggleRead}
                paper={paper}
              />
            ))}
          </div>
        ) : (
          <div className="library-empty">
            <span aria-hidden="true">∅</span>
            <h3>{papers.length ? "没有符合条件的论文" : "这个主题还没有论文"}</h3>
            <p>{papers.length ? "换一个关键词，或者清除当前筛选条件。" : `把第一篇 ${collection.titleEn} 论文带回聊天，完成精读后会出现在这里。`}</p>
            {papers.length ? (
              <button onClick={clearFilters} type="button">清除筛选</button>
            ) : (
              <button onClick={() => setIsCreateOpen(true)} type="button">添加第一篇论文</button>
            )}
          </div>
        )}
      </section>

      <footer className="library-footer">
        <span>Paper Atlas · {collection.titleZh}</span>
        <p>按主题收藏 · 逐篇精读 · 证据可追溯</p>
      </footer>

      {isCreateOpen ? (
        <CreatePaperDialog collection={collection} onClose={() => setIsCreateOpen(false)} />
      ) : null}
    </main>
  );
}
