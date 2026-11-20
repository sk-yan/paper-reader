/** Active interests for the future discovery pipeline, not a running scheduler.
 * Keep this separate from collections: changing interests must not delete or
 * relabel the existing reading archive.
 */
export const researchFocus = [
  { slug: "world-models", label: "世界模型", titleEn: "World Models",
    keywords: ["world model", "world models", "latent dynamics", "environment model"] },
  { slug: "robotics", label: "机器人", titleEn: "Robotics",
    keywords: ["robot learning", "robotic manipulation", "embodied intelligence", "vision-language-action"] },
  { slug: "agent-memory", label: "Agent Memory", titleEn: "Agent Memory",
    keywords: ["agent memory", "episodic memory", "memory-augmented agent", "long-term memory"] },
  { slug: "rsi", label: "RSI", titleEn: "Recursive Self-Improvement",
    keywords: ["recursive self-improvement", "self-improving agent", "self-evolving agent", "self-improvement"] },
  { slug: "world-action-models", label: "世界动作模型", titleEn: "World–Action Models",
    keywords: ["world-action model", "world action model", "world-action models", "video-action model"] },
] as const;

// Future discovery deduplicates by canonical paper ID; overlapping topics are
// tags on the same candidate. Keywords alone are not proof of relevance.
