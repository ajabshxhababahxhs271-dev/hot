// ─── Baidu Hot Search Crawler ─────────────────────────
// Public API: https://top.baidu.com/api/board?platform=wise&tab=realtime
// No auth required. Returns top 50 trending search terms.

import type { Crawler, CrawlResult, RawItem } from './types'

interface BaiduCard {
  component: string
  content: Array<{
    content?: Array<{
      isTop?: boolean
      index?: number
      word?: string
      url?: string
      hotTag?: string
      desc?: string
    }>
  }>
}

interface BaiduResponse {
  success: boolean
  data: {
    cards: BaiduCard[]
  }
}

export const baiduCrawler: Crawler = {
  name: 'Baidu Hot Search',
  type: 'api',

  async crawl(url: string): Promise<CrawlResult> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) HotTopicsAggregator/1.0',
          Accept: 'application/json',
          Referer: 'https://top.baidu.com/',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        return { items: [], error: `Baidu API HTTP ${res.status}` }
      }

      const json = (await res.json()) as BaiduResponse

      if (!json.success || !json.data?.cards) {
        return { items: [], error: 'Baidu API returned unexpected structure' }
      }

      const items: RawItem[] = []

      for (const card of json.data.cards) {
        if (card.component !== 'tabTextList') continue
        for (const group of card.content) {
          if (!group.content) continue
          for (const item of group.content) {
            const title = item.word
            if (!title) continue

            // Decode URL if needed
            const itemUrl = item.url
              ? decodeURIComponent(item.url)
              : `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`

            items.push({
              title,
              url: itemUrl,
              rank: item.index ?? items.length + 1,
              heat: item.hotTag ? parseInt(item.hotTag, 10) : undefined,
              tags: ['百度热搜'],
            })
          }
        }
      }

      return { items }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { items: [], error: `Baidu fetch failed: ${message}` }
    }
  },
}
