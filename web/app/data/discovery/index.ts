import firstDigest from "./2026-11-20.json";
import november21 from "./2026-11-21.json";
import november22 from "./2026-11-22.json";
import november23 from "./2026-11-23.json";
import november24 from "./2026-11-24.json";
import november25 from "./2026-11-25.json";
import november26 from "./2026-11-26.json";
import type { DiscoveryDigest } from "../../lib/discovery";

// Add future daily JSON imports here. New dates are statically exported.
export const discoveryDigests: DiscoveryDigest[] = [firstDigest, november21, november22, november23, november24, november25, november26]
  .sort((a, b) => b.date.localeCompare(a.date));

// Pass only this small teaser to the library's client component, not all reports.
export const latestDiscoverySummary = discoveryDigests[0] ? {
  date: discoveryDigests[0].date,
  candidateCount: discoveryDigests[0].candidates.length,
  updateCount: discoveryDigests[0].updates.length,
} : undefined;
