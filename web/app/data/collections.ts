import type { PaperCollection } from "../lib/library";

export const paperCollections: PaperCollection[] = [
  {
    slug: "world-models",
    titleZh: "世界模型",
    titleEn: "World Models",
    description:
      "从环境预测与具身规划，到跨回合记忆、运行时适应和自进化智能体。",
    eyebrow: "WORLD MODELS · EMBODIED AGENTS · MEMORY",
    accent: "cobalt",
    order: 1,
  },
  {
    slug: "latent-reasoning",
    titleZh: "潜空间推理",
    titleEn: "Latent Reasoning",
    description:
      "探索模型在连续潜表示中的多步推理，关注潜在思维链、隐状态计算与推理效率。",
    eyebrow: "LATENT REASONING · CONTINUOUS THOUGHT · HIDDEN STATES",
    accent: "moss",
    order: 2,
    archived: true,
  },
];
