export type PaperStatus = "completed" | "reading" | "queued";
export type LibraryFilter = PaperStatus | "all";
export type PublicationKind =
  | "conference"
  | "journal"
  | "workshop"
  | "preprint";
export type PublicationStatus = "published" | "accepted" | "preprint";

export type PaperPublication = {
  kind: PublicationKind;
  status: PublicationStatus;
  venue: string;
  year: number;
  url: string;
  note?: string;
};
export type CollectionSlug =
  | "world-models"
  | "uncategorized"
  | (string & {});

export type PaperCollection = {
  slug: CollectionSlug;
  titleZh: string;
  titleEn: string;
  description: string;
  eyebrow: string;
  accent: "cobalt" | "vermilion" | "moss" | "ochre";
  order: number;
  showWhenEmpty?: boolean;
  archived?: boolean;
};

export type LibraryPaper = {
  slug: string;
  collection: CollectionSlug;
  titleEn: string;
  titleZh: string;
  authors: string;
  year: number;
  domains: string[];
  publication: PaperPublication;
  status: PaperStatus;
  progress: number;
  stage: string;
  summary: string;
  updatedAt: string;
  href?: string;
  codeUrl?: string;
  isExample?: boolean;
};

export type LibraryCounts = Record<LibraryFilter, number>;

export function formatPublicationLabel(
  publication: PaperPublication,
): string {
  if (publication.kind === "preprint") {
    return `arXiv 预印本 · ${publication.year}`;
  }
  if (publication.kind === "workshop") {
    return `${publication.venue} · ${publication.year} Workshop${
      publication.note ? ` · ${publication.note}` : ""
    }`;
  }
  return `${publication.venue} · ${publication.year}`;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export function filterPapers(
  papers: LibraryPaper[],
  query: string,
  status: LibraryFilter,
  domain: string,
): LibraryPaper[] {
  const normalizedQuery = normalize(query);

  return papers.filter((paper) => {
    const matchesStatus = status === "all" || paper.status === status;
    const matchesDomain =
      domain === "all" || paper.domains.some((item) => item === domain);
    const searchable = [
      paper.slug,
      paper.titleEn,
      paper.titleZh,
      paper.authors,
      paper.stage,
      paper.summary,
      paper.publication.venue,
      formatPublicationLabel(paper.publication),
      ...paper.domains,
    ]
      .map(normalize)
      .join(" ");
    const matchesQuery =
      normalizedQuery.length === 0 || searchable.includes(normalizedQuery);

    return matchesStatus && matchesDomain && matchesQuery;
  });
}

export function countPapersByStatus(
  papers: LibraryPaper[],
): LibraryCounts {
  return papers.reduce<LibraryCounts>(
    (counts, paper) => {
      counts.all += 1;
      counts[paper.status] += 1;
      return counts;
    },
    { all: 0, completed: 0, reading: 0, queued: 0 },
  );
}
