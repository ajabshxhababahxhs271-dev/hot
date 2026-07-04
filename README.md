# 全球热点实时聚合与 AI 分类展示

## 线上部署

生产环境推荐使用：

- Vercel：部署 Next.js 应用
- Neon PostgreSQL：线上数据库
- Vercel Cron：定时触发 `/api/cron/crawl`

不要把真实数据库连接字符串提交到 GitHub。连接字符串只放在本地 `.env`
或 Vercel Environment Variables。

### Neon

1. 在 Neon 创建 PostgreSQL 项目
2. 复制连接字符串，格式类似：

```bash
postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
```

3. 本地创建 `.env`，填入：

```bash
DATABASE_URL="你的 Neon 连接字符串"
```

`.env` 已被 `.gitignore` 忽略，不要提交。

### 初始化线上数据库

连接 Neon 后运行：

```bash
npx prisma db push
npm run seed
```

如需先采集一批数据：

```bash
npm run crawl
```

### Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 导入 GitHub 仓库
3. 在 Vercel 的 `Settings -> Environment Variables` 添加：

```bash
DATABASE_URL=你的 Neon 连接字符串
CRON_SECRET=一个足够长的随机密钥
```

4. 重新 Deploy

项目包含 `vercel.json`，会每 10 分钟调用一次：

```txt
/api/cron/crawl
```

## 快速开始

```bash
npm install
npx prisma db push
npm run seed
npm run crawl
npm run dev         # → http://localhost:3000
```

## 页面

| 路由 | 说明 |
|------|------|
| `/` | 实时总览 — 统计卡片 + 24h采集图 + 分类分布 + 最新热点 |
| `/china` | 国内热点 — 按分类/来源筛选 |
| `/global` | 国际热点 — 按分类/来源筛选 |
| `/ai` | AI 热点 + AI 子类分布 |
| `/analytics` | 趋势分析 |
| `/sources` | 数据源管理（含状态/错误/采集数） |
| `/crawl-log` | 采集日志（每次采集耗时/新增/跳过） |
| `/settings` | 系统设置 |

## 数据源状态（30 个）

### ✅ 已真实采集成功（12 个）

| 来源 | 地区 | 类型 | 分类 |
|------|------|------|------|
| B站热门 | 🇨🇳 国内 | API (bilibili) | 娱乐 |
| 36氪 | 🇨🇳 国内 | RSS | 科技 |
| Hacker News | 🌍 国际 | RSS | 科技 |
| The Verge | 🌍 国际 | RSS | 科技 |
| TechCrunch | 🌍 国际 | RSS | 科技 |
| Wired | 🌍 国际 | RSS | 科技 |
| Ars Technica | 🌍 国际 | RSS | 科技 |
| Google News | 🌍 国际 | RSS | 综合 |
| MIT Tech Review | 🌍 国际 | RSS | 科技/AI |
| Science Daily AI | 🌍 国际 | RSS | AI |
| Techmeme | 🌍 国际 | RSS | 科技 |
| Bloomberg via Google News | 🌍 国际 | RSS | 财经 |

### ⏸ 因网络限制暂时 disabled（18 个）

大多使用 RSSHub (rsshub.app) 代理，当前网络不可达；部分站点反爬严格或需认证：

- 机器之心 / 量子位 / 澎湃新闻 / 央视新闻 (RSSHub 超时)
- 百度热搜 / 微博热搜 / 知乎热榜 (反爬/需认证)
- Bloomberg Official Markets (官方候选 feed 本地测试 SSL/超时失败；保留 disabled，使用 Bloomberg via Google News 保底)
- Reddit 系列 (RSS 超时)
- OpenAI / Anthropic / DeepMind Blog (RSSHub 超时)
- arXiv AI / Papers With Code / GitHub Trending (RSSHub 超时)
- Product Hunt / Reuters / MIT Tech Review 旧版 (RSSHub 超时)
- Hugging Face Blog (TLS 错误)
- BBC News (RSS 30s 超时)

## 定时采集

```bash
npm run scheduler                # node-cron 守护进程
npm run crawl                    # 手动采集所有启用源
npm run crawl -- hacker-news     # 手动采集单个源
```

## 如何新增数据源

1. 编辑 `scripts/seed-sources.ts`（或 `prisma/seed.ts`），添加条目
2. 运行 `npm run seed`
3. 运行 `npm run crawl` 测试

## 如何新增 Crawler

1. 在 `src/lib/crawlers/` 下创建新文件
2. 实现 `Crawler` 接口（见 `src/lib/crawlers/types.ts`）
3. 在 `src/lib/crawlers/index.ts` 的 `typeRegistry` 或 `slugRegistry` 中注册
4. 在 `seed-sources.ts` 中为新数据源指定对应的 `type` 或 `slug`

## 技术栈

Next.js 16 · shadcn/ui v4 (Base UI) · Tailwind CSS v4 · Prisma + PostgreSQL · Recharts · RSS Parser · Cheerio · Bilibili Public API
