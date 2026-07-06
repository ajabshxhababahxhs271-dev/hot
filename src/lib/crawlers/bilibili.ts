// ─── Bilibili Hot List Crawler ────────────────────────
// Public API: https://api.bilibili.com/x/web-interface/popular
// No authentication required. Returns top 50 videos.

import type { Crawler, CrawlResult, RawItem } from './types'

export const bilibiliCrawler: Crawler = {
  name: 'Bilibili Hot List',
  type: 'api',

  async crawl(url: string): Promise<CrawlResult> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) HotTopicsAggregator/1.0',
          Referer: 'https://www.bilibili.com/',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        return { items: [], error: `Bilibili API HTTP ${res.status}` }
      }

      const json = (await res.json()) as {
        code: number
        message: string
        data: {
          list?: Array<{
            aid: number
            bvid: string
            title: string
            pic: string
            desc: string
            owner: { name: string; mid: number }
            stat: { view: number; danmaku: number; reply: number; favorite: number; coin: number; share: number; like: number }
            cid: number
            duration: number
            pubdate: number
          }>
        }
      }

      if (json.code !== 0 || !json.data?.list) {
        return {
          items: [],
          error: `Bilibili API error: code=${json.code} message=${json.message}`,
        }
      }

      const items: RawItem[] = json.data.list.map((video, index) => ({
        title: video.title,
        url: `https://www.bilibili.com/video/${video.bvid}`,
        summary: video.desc?.slice(0, 300) || undefined,
        score: video.stat?.view || 0,
        heat: (video.stat?.view || 0) + (video.stat?.like || 0) * 2 + (video.stat?.reply || 0) * 3,
        rank: index + 1,
        publishedAt: video.pubdate ? new Date(video.pubdate * 1000) : undefined,
        tags: ['bilibili', '视频', video.owner?.name].filter(Boolean) as string[],
      }))

      return { items }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { items: [], error: `Bilibili fetch failed: ${message}` }
    }
  },
}
