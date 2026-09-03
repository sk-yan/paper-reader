# Thirteen-Chapter Close-Reading Report Contract

## Grounding rules

- Write in Chinese.
- Explain a term before relying on it.
- Bind important conclusions to the paper's section, equation, algorithm, figure, table, appendix, or experiment.
- Use `论文事实` for claims explicitly supported by the source.
- Use `评价` for evidence-based critique.
- Use `这是推断` for reasoned conclusions not explicitly made by the authors.
- Use `不确定` when the available paper content does not support a reliable answer.
- Do not turn the report into an expanded abstract. Teach the paper from global understanding to mechanisms, evidence, critique, and transfer.
- Preserve narrow claims: prediction quality is not automatically planning quality; confidence is not automatically calibration; engineering integration is not automatically a new learning principle.

## Required opening

Start with:

```markdown
# 《<Paper title>》中文精读报告

> 论文：<verified citation>
> 阅读约定：
> - “论文事实”……
> - “评价”……
> - “这是推断”……
```

## Required chapters

### 1. 这篇论文一句话在做什么

State in direct language:

- the research object;
- the problem;
- the proposed method.

End with one technically precise sentence and its source anchor.

### 2. 背景从 0 讲起

Explain:

- what the field originally tries to solve;
- mainstream prior approaches;
- their limitations;
- why this problem matters.

### 3. 论文的问题定义

Explicitly identify:

- inputs;
- outputs;
- optimization objective;
- training, testing, and runtime behavior;
- frozen and updated components;
- environment, reward, and feedback.

If no loss or training exists, say so directly.

### 4. 方法总览

Give a numbered step-by-step workflow before formulas. Explain the purpose of each step and why it is required. Include a compact text flow diagram when the method has at least three connected modules.

### 5. 核心机制精读

For every key module, cover:

- problem solved;
- operation;
- inputs;
- outputs;
- connections;
- expected effect if removed.

Tie removal claims to ablations when available.

### 6. 公式/算法逐行解释

Do not skip equations or algorithms. For each:

- define every symbol;
- state what is calculated;
- map it to the workflow;
- explain intuition;
- show implementation-oriented pseudocode.

For an algorithm, explain initialization, every branch or update, and returned values.

### 7. 实验部分精读

Cover:

- datasets, benchmarks, and environments;
- backbone models;
- API, local, and trainable status;
- baselines;
- metric definitions;
- meaning of every main-table row and column;
- key results;
- ablations;
- weak, mixed, or cautionary results.

Quote exact numbers only after verifying the table.

### 8. 训练和推理成本分析

State:

- whether model parameters train;
- whether only memory, context, or cache changes;
- GPU and API requirements;
- dominant experiment cost;
- minimum reproduction configuration.

Do not invent unreported cost numbers.

### 9. 这篇论文真正的贡献

Separate:

- claimed contributions;
- defensible contributions;
- engineering combinations;
- likely reviewer objections.

### 10. 和相关论文的关系

Compare against:

- RAG and memory agents;
- test-time adaptation;
- reinforcement learning;
- world models;
- agent planning;
- self-evolving agents.

Also compare concrete related works named in the paper.

### 11. 我应该怎么复现一个最小版本

Provide:

- minimum environment;
- minimum model;
- stored data structures;
- stepwise pseudocode;
- required logs;
- minimum experiment tables.

Separate paper-required fields from reproduction improvements proposed by the reviewer.

### 12. 如果我要基于它做新论文

Give exactly five feasible directions. For each:

- idea;
- change from the paper;
- why it may work;
- required experiments;
- risks.

Label the whole chapter as research proposals rather than paper content.

### 13. 阅读检查题与参考答案

Provide exactly 10 questions and answers spanning:

- background;
- method;
- formulas or algorithms;
- experiments;
- limitations;
- reproducibility.

Questions must test understanding rather than recall of section titles.

## Final report checks

- Exactly 13 numbered `##` chapters.
- Exactly five directions in Chapter 12.
- Exactly 10 questions with answers in Chapter 13.
- Every main table and central algorithm is discussed.
- Strongest positive and strongest cautionary result are both reported.
- All uncertain or inferred statements are labeled.
- No chapter is empty or generic.

