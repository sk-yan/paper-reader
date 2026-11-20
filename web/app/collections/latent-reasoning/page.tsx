import type { Metadata } from "next";
import { PaperIndexApp } from "../../components/PaperIndexApp";
import { paperCollections } from "../../data/collections";
import { libraryPapers } from "../../data/library";
import { latestDiscoverySummary } from "../../data/discovery";

const collection = paperCollections.find(item => item.slug === "latent-reasoning")!;

export const metadata: Metadata = {
  title: "潜空间推理 · Latent Reasoning | Paper Atlas",
  description: collection.description,
};

export default function LatentReasoningCollectionPage() {
  return <PaperIndexApp initialCollection={collection.slug} collections={paperCollections}
    papers={libraryPapers} latestDiscovery={latestDiscoverySummary} />;
}
