// ─── Juejin (掘金) Hot Articles Crawler ──────────────
// Public API: https://api.juejin.cn/content_api/v1/content/article_rank
// No auth required. Returns trending tech articles.

import type { Crawler, CrawlResult, RawItem } from './types'

interface JuejinItem {
  content: {
    content_id: string
    title: string
    brief: string
    category_id: string
    tag_ids: string[]
  }
  content_counter: {
    view: number
    like: number
    collect: number
    hot_rank: number
    comment_count: number
  }
  author: {
    user_id: string
    name?: string
  }
}

interface JuejinResponse {
  err_no: number
  err_msg: string
  data: JuejinItem[]
}

export const juejinCrawler: Crawler = {
  name: 'Juejin Hot Articles',
  type: 'api',

  async crawl(url: string): Promise<CrawlResult> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) HotTopicsAggregator/1.0',
          Accept: 'application/json',
          Referer: 'https://juejin.cn/',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        return { items: [], error: `Juejin API HTTP ${res.status}` }
      }

      const json = (await res.json()) as JuejinResponse

      if (json.err_no !== 0 || !json.data) {
        return { items: [], error: `Juejin API error: ${json.err_msg}` }
      }

      const items: RawItem[] = json.data.map((item, index) => ({
        title: item.content.title,
        url: `https://juejin.cn/post/${item.content.content_id}`,
        summary: item.content.brief?.slice(0, 300) || undefined,
        score: item.content_counter.view,
        heat: item.content_counter.hot_rank,
        rank: index + 1,
        tags: ['掘金', '技术文章'],
      }))

      return { items }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { items: [], error: `Juejin fetch failed: ${message}` }
    }
  },
}
