import type { Metadata } from "next";
import { PaperIndexApp } from "../../components/PaperIndexApp";
import { paperCollections } from "../../data/collections";
import { libraryPapers } from "../../data/library";
import { latestDiscoverySummary } from "../../data/discovery";

const collection = paperCollections.find(
  (item) => item.slug === "world-models",
)!;

export const metadata: Metadata = {
  title: "世界模型 · World Models | Paper Atlas",
  description: collection.description,
};

export default function WorldModelsCollectionPage() {
  return (
    <PaperIndexApp
      initialCollection={collection.slug}
      collections={paperCollections}
      papers={libraryPapers}
      latestDiscovery={latestDiscoverySummary}
    />
  );
}
