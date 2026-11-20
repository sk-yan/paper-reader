import firstDigest from "./2026-11-20.json";
import type { DiscoveryDigest } from "../../lib/discovery";

// Add future daily JSON imports here. New dates are statically exported.
export const discoveryDigests: DiscoveryDigest[] = [firstDigest]
  .sort((a, b) => b.date.localeCompare(a.date));

// Pass only this small teaser to the library's client component, not all reports.
export const latestDiscoverySummary = discoveryDigests[0] ? {
  date: discoveryDigests[0].date,
  candidateCount: discoveryDigests[0].candidates.length,
  updateCount: discoveryDigests[0].updates.length,
} : undefined;
