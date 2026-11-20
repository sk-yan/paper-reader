export type DiscoveryPaper = {
  id: string;
  title: string;
  authors: string[];
  published: string;
  updated: string;
  version: string;
  url: string;
  topics: string[];
};

export type DiscoveryDigest = {
  date: string;
  windowStart: string;
  windowEnd: string;
  summary: string;
  priorities: { id: string; label: string; reason?: string }[];
  reportMarkdown: string;
  appendixMarkdown: string;
  candidates: DiscoveryPaper[];
  updates: DiscoveryPaper[];
};

export function filterDiscoveryPapers(papers: DiscoveryPaper[], query: string, topic: string) {
  const q = query.trim().toLocaleLowerCase();
  return papers.filter((paper) =>
    (topic === "all" || paper.topics.includes(topic)) &&
    (!q || [paper.id, paper.title, ...paper.authors].join(" ").toLocaleLowerCase().includes(q)),
  );
}
