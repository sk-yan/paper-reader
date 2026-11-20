# 发布每日发现

公开页面：[每日发现](https://sk-yan.github.io/paper-reader/discovery/)。每期永久链接为 `/paper-reader/discovery/YYYY-MM-DD/`。

## 栏目边界

- 每日发现是候选初筛，不是13章精读。不得把候选追加到 `libraryPapers` 并标记 completed。
- 只发布已核验论文元数据、官方链接与原创简述/评论。不得复制全文、完整译文、原图或PDF；不上传私人库、抓取缓存、自动化状态、令牌或本地绝对路径。
- 区分简报日期、首次提交日期和修订日期；有范围与数量上限的查询不能宣称全网覆盖。部分来源失败时注明缺口，不能把失败当零新增。
- 同一篇论文跨主题只有一条 candidate，topics 可多选。旧稿更新单列 updates。不要将主观初筛分数写成作者指标或质量认证。

## 新一期发布步骤

1. 读取当前 `web/app/data/research-focus.ts` 与公开库登记，完成去重、日期和来源核验。
2. 创建 `web/app/data/discovery/YYYY-MM-DD.json`，沿用已发布样例与 `web/app/lib/discovery.ts` 类型。保留 windowStart/windowEnd、summary、priorities、candidates、updates、原创 reportMarkdown 与 appendixMarkdown。
3. 在 `web/app/data/discovery/index.ts` 导入并注册该期。日期页通过 generateStaticParams 自动导出，列表入口和“最新一期”自动更新。重复运行同一天时更新原日期，不新增重复日报。
4. 简报内部的筛选附录链接使用 `#screening`；完整候选可用 `#candidates`。不要留下 `.md` 相对链接或本地文件链接。
5. 执行 `npm test`、`npm run typecheck`、`node ../scripts/check-public-release.mjs`；使用 `PAPER_ATLAS_STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/paper-reader npm run build:pages` 构建，再执行 `node ../scripts/check-pages-export.mjs`。检查新数据不包含私有路径、原文媒体、密钥。
6. 只提交本期数据与必要注册改动，推送 `sk-yan/paper-reader`，等待 GitHub Pages 成功后读取真实日期URL。内容已生成、已推送、已上线是三个不同状态。
7. 在 Codex 聊天给出线上链接；若推送或部署失败，报告失败阶段，不声称已上线。清理本次生成的临时依赖和构建目录，保留可恢复的源码。

日常调度由 Codex 中的「Paper Atlas 每日论文发现」执行，不依赖新增GitHub定时工作流，也不恢复私人库同步。
