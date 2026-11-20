import { filterPapers, type LibraryFilter, type LibraryPaper } from "./library";

export type ReadFilter = "all" | "unread" | "read";

export function cataloguePapers(
  papers: LibraryPaper[],
  filters: { query: string; collection: string; status: LibraryFilter; read: ReadFilter },
  readPapers: ReadonlySet<string>,
) {
  return filterPapers(papers, filters.query, filters.status, "all")
    .filter((paper) => filters.collection === "all" || paper.collection === filters.collection)
    .filter((paper) => filters.read === "all" || readPapers.has(paper.slug) === (filters.read === "read"))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.titleEn.localeCompare(b.titleEn));
}
