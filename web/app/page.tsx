import type { Metadata } from "next";
import { PaperIndexApp } from "./components/PaperIndexApp";
import { paperCollections } from "./data/collections";
import { libraryPapers } from "./data/library";

export const metadata: Metadata = {
  title: "Paper Atlas · 论文精读库",
  description:
    "持续生长的中英双语论文精读库，包含论文状态、证据定位与结构化精读报告。",
};

export default function Home() {
  return <PaperIndexApp collections={paperCollections} papers={libraryPapers} />;
}
