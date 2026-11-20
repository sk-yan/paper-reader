"use client";

import { useEffect, useMemo, useState } from "react";
import { cataloguePapers, type ReadFilter } from "../lib/catalogue";
import { formatPublicationLabel, type LibraryFilter, type LibraryPaper, type PaperCollection } from "../lib/library";
import { READ_PAPERS_STORAGE_KEY, parseReadPapers, serializeReadPapers, toggleReadPaper } from "../lib/read-papers";
import { withBasePath } from "../lib/site-url";
import { PaperCard } from "./PaperLibraryApp";
import { CreatePaperDialog } from "./CreatePaperDialog";

const statusLabels = { completed: "精读已完成", reading: "精读中", queued: "待读" };

export function PaperIndexApp({ papers, collections, initialCollection = "all" }: {
  papers: LibraryPaper[];
  collections: PaperCollection[];
  initialCollection?: string;
}) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState(initialCollection);
  const [status, setStatus] = useState<LibraryFilter>("all");
  const [read, setRead] = useState<ReadFilter>("all");
  const [view, setView] = useState<"list" | "cards">("list");
  const [readPapers, setReadPapers] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setReadPapers(parseReadPapers(localStorage.getItem(READ_PAPERS_STORAGE_KEY))); }
      catch { setStorageUnavailable(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => cataloguePapers(papers, { query, collection, status, read }, readPapers),
    [papers, query, collection, status, read, readPapers]);
  const selectedCollection = collections.find((item) => item.slug === collection);
  const toggleRead = (slug: string) => {
    const next = toggleReadPaper(readPapers, slug);
    setReadPapers(next);
    try { localStorage.setItem(READ_PAPERS_STORAGE_KEY, serializeReadPapers(next)); }
    catch { setStorageUnavailable(true); }
  };
  const clear = () => { setQuery(""); setCollection("all"); setStatus("all"); setRead("all"); };

  return (
    <main className="paper-index">
      <a className="index-skip" href="#paper-list">跳到论文列表</a>
      <header className="index-nav">
        <a className="index-brand" href={withBasePath("/")}><b>PA</b><span>Paper Atlas<small>ShengKun Yan · 论文精读</small></span></a>
        <nav aria-label="主导航">
          <a href="https://sk-yan.github.io/">个人主页</a>
          <a aria-current="page" href={withBasePath("/")}>论文精读</a>
          <a href="https://github.com/sk-yan/paper-reader">GitHub ↗</a>
        </nav>
      </header>
      <div className="index-container">
        <section className="index-heading">
          <div><p className="index-eyebrow">READING NOTES / 研究笔记</p><h1>论文精读<span>从问题读到方法，从结果读到边界。</span></h1>
            <p>逐篇整理方法、图表、实验和导师解读。选一篇，直接开始读。</p></div>
          <button className="index-add" type="button" onClick={() => setIsCreateOpen(true)}>＋ 添加论文</button>
        </section>
        <section className="index-controls" aria-label="论文检索与筛选">
          <label className="index-search"><span>搜索论文</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、作者、方法或关键词…" /></label>
          <div className="index-topics" role="group" aria-label="按主题筛选">
            <button type="button" aria-pressed={collection === "all"} onClick={() => setCollection("all")}>全部主题 <small>{papers.length}</small></button>
            {collections.map((item) => <button type="button" key={item.slug} aria-pressed={collection === item.slug} onClick={() => setCollection(item.slug)}>{item.titleZh} <small>{papers.filter((paper) => paper.collection === item.slug).length}</small></button>)}
          </div>
          <div className="index-options">
            <label>制作状态<select value={status} onChange={(event) => setStatus(event.target.value as LibraryFilter)}><option value="all">全部状态</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>我的阅读<select value={read} onChange={(event) => setRead(event.target.value as ReadFilter)}><option value="all">全部</option><option value="unread">未读</option><option value="read">已读</option></select></label>
            <div className="index-view" role="group" aria-label="目录显示方式"><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>列表</button><button type="button" aria-pressed={view === "cards"} onClick={() => setView("cards")}>翻转卡片</button></div>
          </div>
        </section>
        <div className="index-results"><p role="status">{selectedCollection?.titleZh || "全部论文"} · {visible.length} 篇<span>按最近更新排序</span></p><small>{storageUnavailable ? "无法保存到浏览器，已读标记仅在本次页面有效。" : "已读标记仅保存在当前浏览器。"}</small></div>
        <section id="paper-list" aria-label="论文列表" tabIndex={-1}>
          {!visible.length ? <div className="index-empty"><h2>{selectedCollection && !papers.some((paper) => paper.collection === collection) ? "这个主题还没有论文" : "没有找到符合条件的论文"}</h2><p>可以调整筛选，或回到 Codex 聊天添加下一篇。</p><button type="button" onClick={clear}>查看全部论文</button></div>
            : view === "cards" ? <div className="library-grid">{visible.map((paper, index) => <PaperCard key={paper.slug} paper={paper} index={index} isRead={readPapers.has(paper.slug)} onToggleRead={toggleRead} />)}</div>
            : <ol className="index-list">{visible.map((paper, index) => {
              const isRead = readPapers.has(paper.slug);
              return <li key={paper.slug} className={isRead ? "is-read" : ""}>
                <span className="index-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <article>
                  <div className="index-paper-meta"><span>{collections.find((item) => item.slug === paper.collection)?.titleZh || "未分类"}</span><a href={paper.publication.url} target="_blank" rel="noreferrer">{formatPublicationLabel(paper.publication)}</a><span>{statusLabels[paper.status]}</span></div>
                  <h2>{paper.href ? <a href={withBasePath(paper.href)}>{paper.titleEn}</a> : paper.titleEn}</h2>
                  <p className="index-title-zh">{paper.titleZh}</p><p className="index-summary">{paper.summary}</p>
                  <footer><span>更新于 {paper.updatedAt}</span>{paper.href ? <a href={withBasePath(paper.href)}>阅读精读 →</a> : <span>{paper.stage} · {paper.progress}%</span>}{paper.codeUrl ? <a href={paper.codeUrl} target="_blank" rel="noreferrer">GitHub ↗</a> : null}</footer>
                </article>
                <button type="button" className="index-read" aria-pressed={isRead} aria-label={`${isRead ? "取消" : "标记"}已读：${paper.titleEn}`} onClick={() => toggleRead(paper.slug)}><span aria-hidden="true">{isRead ? "✓" : "○"}</span>{isRead ? "已读" : "标记已读"}</button>
              </li>;
            })}</ol>}
        </section>
        <footer className="index-footer"><span>Paper Atlas · 阅读、理解、验证</span><p>公开内容按来源许可提供。未经确认可转载的全文，保留独立报告与官方原文链接。</p></footer>
      </div>
      {isCreateOpen ? <CreatePaperDialog collection={selectedCollection} onClose={() => setIsCreateOpen(false)} /> : null}
    </main>
  );
}
