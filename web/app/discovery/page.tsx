import type { Metadata } from "next";
import { DailyDiscoveryApp } from "../components/DailyDiscoveryApp";
import { discoveryDigests } from "../data/discovery";

export const metadata: Metadata = {
  title: "每日发现 · 新论文候选 | Paper Atlas",
  description: "世界模型、机器人、Agent Memory、RSI 与世界动作模型的每日论文简报。候选初筛与正式精读分开呈现。",
};

export default function DiscoveryPage() {
  return <DailyDiscoveryApp digest={discoveryDigests[0]} dates={discoveryDigests.map((item) => item.date)} />;
}
