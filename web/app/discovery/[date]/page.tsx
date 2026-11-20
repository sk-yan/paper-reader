import { notFound } from "next/navigation";
import { DailyDiscoveryApp } from "../../components/DailyDiscoveryApp";
import { discoveryDigests } from "../../data/discovery";

export const dynamicParams = false;
export const metadata = { title: "每日发现 · 历史简报 | Paper Atlas" };

export function generateStaticParams() {
  return discoveryDigests.map((digest) => ({ date: digest.date }));
}

export default async function DailyPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const digest = discoveryDigests.find((item) => item.date === date);
  if (!digest) notFound();
  return <DailyDiscoveryApp digest={digest} dates={discoveryDigests.map((item) => item.date)} />;
}
