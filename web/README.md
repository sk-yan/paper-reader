# Paper Atlas 阅读器

## [直接打开精读库 →](https://sk-yan.github.io/paper-reader/)

日常阅读只需打开上面的网页。以下命令仅供开发者，不需要在自己的Mac安装这些依赖才能阅读。

首页直接显示全部论文，支持关键词、主题、制作状态与个人已读筛选，默认按最近更新排序。列表与翻转卡片可以切换；主题旧链接仍保留，并直接进入该主题的筛选结果。单篇默认打开导师精读报告，可切换到原文/翻译或桌面双栏对照。既有章节与原文块锚点仍可直接打开。个人主页的「论文精读」栏目直接进入此目录。

完整前端源码，可独立运行；不需要原维护者的 Sites、Cloudflare 或 ChatGPT 登录配置。

```bash
npm ci
npm run dev
```

打开终端打印的地址。`npm run build` 和 `npm start` 仍提供Node版本；公开前端由GitHub Actions自动静态导出并发布到GitHub Pages，不改变维护者已有的私人网站。

Pages构建使用 `PAPER_ATLAS_STATIC_EXPORT=1` 和 `NEXT_PUBLIC_BASE_PATH=/paper-reader`，运行 `npm run build:pages` 后验证 `dist/client`。锁定的vinext0.0.50预渲染请求遗漏basePath，构建脚本应用一个版本与代码形状均受检查的兼容补丁；升级vinext时须重新审核或移除补丁。不要把`dist/server`上传到Pages。

## 内容结构

### 当前关注方向与每日发现计划

关注配置见 `app/data/research-focus.ts`：世界模型、机器人、Agent Memory、RSI（Recursive Self-Improvement，递归自我改进）、世界动作模型（World–Action Models）。维护者在 Codex 中运行每日发现任务，并把核验后的原创简报发布到 `/discovery/`；本仓库本身不包含自动抓取cron，其他使用者需自行配置调度。发布步骤见根目录 `DISCOVERY.md`。

流程是自动发现候选并发布每日简报 → 用户选择 → 在 Codex 中核对全文并完成精读。候选不得标记为“精读已完成”；按论文 ID 去重，跨方向仅增加标签，不重复收录。RSI/WAM 等缩写需结合标题、摘要判断，不能单凭缩写命中。

Latent Reasoning 已停止关注并归档：首页不再推荐该主题，但旧路由、已有内容与“全部论文”中的历史记录保留。关注标签不同于存档书架，现有论文不会因这次兴趣调整被重新分类。

### 文件位置

- `app/data/library.ts`：论文卡片、主题、经核对的发表信息与官方代码链接。
- `app/data/papers/<slug>/paper.ts`：双语内容；许可未明确允许转载的论文为来源说明。
- `app/data/papers/<slug>/report.ts`：导师报告与证据定位。
- `app/papers/<slug>/page.tsx`：阅读器页面。
- `public/papers/`：允许分发的PDF、图表和部分阅读附件。
- `app/data/content-rights.ts`：与根目录 `content-licenses.json` 对应的许可状态。
- 最早两篇沿用 `app/data/paper.ts`、`report.ts`、`wem-paper.ts`、`wem-report.ts`，不要因命名不同漏改。

“精读已完成”表示内容制作完成，不表示用户已经看过。用户的已读卡片、阅读位置、分栏和语言偏好存在该浏览器的 localStorage，不会通过 GitHub 自动跨设备同步。

## 验证

```bash
node ../scripts/check-public-release.mjs
npm test
npm run typecheck
npm run build
```

依赖和构建输出不属于源码，不提交 `node_modules`、`dist` 或解析缓存。开发完成且不再需要本地服务时可移除，下一次通过锁文件重新安装/构建。

## 权利边界

程序代码采用根目录MIT许可；论文原文、图表和译文采用逐篇记录的许可，不能统称MIT。World-Ego与RoboMemory内容是CC BY-NC-SA4.0，含非商业及相同方式共享条件。参见根目录 `THIRD_PARTY_NOTICES.md`。
