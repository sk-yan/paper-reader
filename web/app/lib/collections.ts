import type {
  CollectionSlug,
  LibraryPaper,
  PaperCollection,
} from "./library";

export type CollectionSummary = PaperCollection & {
  paperCount: number;
  latestUpdate: string;
  href: string;
};

export function papersForCollection(
  papers: LibraryPaper[],
  slug: CollectionSlug,
): LibraryPaper[] {
  return papers.filter((paper) => paper.collection === slug);
}

export function summarizeNonEmptyCollections(
  collections: PaperCollection[],
  papers: LibraryPaper[],
): CollectionSummary[] {
  return collections
    .filter((collection) => !collection.archived)
    .map((collection) => {
      const matches = papersForCollection(papers, collection.slug);

      return {
        ...collection,
        paperCount: matches.length,
        latestUpdate:
          matches.map((paper) => paper.updatedAt).sort().at(-1) ?? "",
        href: `/collections/${collection.slug}`,
      };
    })
    // Explicitly opened topics are visible even before their first paper arrives.
    .filter((collection) => collection.paperCount > 0 || collection.showWhenEmpty)
    .sort((left, right) => left.order - right.order);
}
