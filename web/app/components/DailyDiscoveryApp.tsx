"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { paperMathOptions, rehypePaperMathCompatibility } from "../lib/math-options";
import { researchFocus } from "../data/research-focus";
import { filterDiscoveryPapers, type DiscoveryDigest, type DiscoveryPaper } from "../lib/discovery";
import { withBasePath } from "../lib/site-url";

type View = "brief" | "candidates" | "screening";
const topicName = (slug: string) => researchFocus.find((topic) => topic.slug === slug)?.label ?? slug;

function DiscoveryList({ papers, updates = false }: { papers: DiscoveryPaper[]; updates?: boolean }) {
  return <ol className="index-list discovery-list">{papers.map((paper, i) => <li key={paper.id}>
    <span className="index-number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
    <article>
      <div className="index-paper-meta"><span>{updates ? "旧稿更新" : "新论文候选 · 未完成精读"}</span><span>{paper.topics.map(topicName).join(" / ")}</span></div>
      <h2><a href={paper.url} target="_blank" rel="noreferrer">{paper.title}</a></h2>
      <p className="index-title-zh">{paper.authors.slice(0, 3).join(" · ")}{paper.authors.length > 3 ? " 等" : ""}</p>
      <footer><span>首次提交 {paper.published.slice(0, 10)} UTC</span>{updates || paper.published !== paper.updated ? <span>修订 {paper.updated.slice(0, 10)} UTC</span> : null}<span>{paper.version}</span><a href={paper.url} target="_blank" rel="noreferrer">官方原文 ↗</a></footer>
    </article>
  </li>)}</ol>;
}

export function DailyDiscoveryApp({ digest, dates }: { digest: DiscoveryDigest; dates: string[] }) {
  const [view, setView] = useState<View>("brief");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1);
      setView(hash === "candidates" || hash === "screening" ? hash : "brief");
    };
    const timer = window.setTimeout(syncHash, 0);
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", syncHash); window.removeEventListener("popstate", syncHash); };
  }, []);
  const chooseView = (next: View) => {
    setView(next);
    window.history.replaceState(null, "", `#${next}`);
  };
  const papers = useMemo(() => filterDiscoveryPapers(digest.candidates, query, topic), [digest.candidates, query, topic]);

  return <main className="paper-index discovery-page">
    <a className="index-skip" href="#discovery-content">跳到每日内容</a>
    <header className="index-nav">
      <a className="index-brand" href={withBasePath("/")}><b>PA</b><span>Paper Atlas<small>发现新论文，再选一篇读深。</small></span></a>
      <nav aria-label="主导航"><a href="https://sk-yan.github.io/">个人主页</a><a href={withBasePath("/discovery/")} aria-current="page">每日发现</a><a href={withBasePath("/")}>精读收藏</a></nav>
    </header>
    <div className="index-container">
      <header className="discovery-heading">
        <p className="index-eyebrow">DAILY DISCOVERY / {digest.date}</p>
        <h1>每日发现<span>今天，有哪些论文值得读？</span></h1>
        <p>{digest.summary}</p>
        <div className="discovery-stats"><span><b>{digest.candidates.length}</b> 新稿候选</span><span><b>{digest.updates.length}</b> 旧稿更新</span><span><b>{digest.priorities.length}</b> 优先精读</span></div>
        <p className="discovery-boundary">已抓取并初筛，不等于完整精读。初筛候选不会计入「精读已完成」。</p>
      </header>
      <nav className="discovery-dates" aria-label="历史日报"><strong>日报日期</strong>{dates.map((date) => <a key={date} aria-current={date === digest.date ? "date" : undefined} href={withBasePath(`/discovery/${date}/`)}>{date}</a>)}</nav>
      <div className="discovery-tabs" role="group" aria-label="每日发现内容">
        {([ ["brief", "今日简报"], ["candidates", `完整候选 · ${digest.candidates.length}`], ["screening", "筛选依据"] ] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => chooseView(key)}>{label}</button>)}
      </div>
      <section id="discovery-content" tabIndex={-1}>
        {view === "brief" ? <section className="discovery-priorities" aria-label="优先精读推荐">{digest.priorities.map((pick, i) => {
          const paper = digest.candidates.find((item) => item.id === pick.id);
          return <article key={pick.id}><span>优先精读 / {String(i + 1).padStart(2, "0")}</span><h2>{pick.label}</h2><p>{pick.reason || paper?.title}</p>{paper ? <a href={paper.url} target="_blank" rel="noreferrer">查看官方论文 ↗</a> : null}</article>;
        })}</section> : null}
        {view === "candidates" ? <>
          <div className="discovery-search"><label className="index-search"><span>搜索候选</span><input type="search" aria-label="搜索候选" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="论文名、作者或 arXiv ID…" /></label>
          <div className="index-topics" role="group" aria-label="按研究方向筛选"><button type="button" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>全部方向</button>{researchFocus.map((item) => <button type="button" key={item.slug} aria-pressed={topic === item.slug} onClick={() => setTopic(item.slug)}>{item.label}</button>)}</div></div>
          <p className="discovery-result" role="status">找到 {papers.length} 篇候选；跨方向不重复展示。</p>
          {papers.length ? <DiscoveryList papers={papers} /> : <div className="index-empty"><h2>没有匹配的候选</h2><button type="button" onClick={() => { setQuery(""); setTopic("all"); }}>清除筛选</button></div>}
          <h2 className="discovery-updates-title">旧稿更新 · {digest.updates.length}</h2><p className="discovery-boundary">以下不计入新稿数量，也不意味着已经完成版本差异核对。</p><DiscoveryList papers={digest.updates} updates />
        </> : <div className="discovery-prose"><ReactMarkdown skipHtml remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypePaperMathCompatibility, [rehypeKatex, paperMathOptions]]} urlTransform={(url) => withBasePath(defaultUrlTransform(url))}>{view === "brief" ? digest.reportMarkdown : digest.appendixMarkdown}</ReactMarkdown></div>}
      </section>
      <footer className="index-footer"><span>Paper Atlas · 来源可追溯，初筛与精读分开</span><p>想深入哪篇？回到 Codex 聊天，发送论文标题或链接即可。</p></footer>
    </div>
  </main>;
}
