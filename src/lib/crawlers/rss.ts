import RssParser from 'rss-parser'
import type { Crawler, CrawlResult, RawItem } from './types'

const parser = new RssParser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; HotTopicsAggregator/1.0; RSS Reader)',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
  },
})

export const rssCrawler: Crawler = {
  name: 'RSS Crawler',
  type: 'rss',

  async crawl(url: string): Promise<CrawlResult> {
    try {
      const feed = await parser.parseURL(url)
      const items: RawItem[] = feed.items.map((item, index) => ({
        title: item.title ?? 'Untitled',
        url: item.link ?? url,
        summary: item.contentSnippet?.slice(0, 500) ?? item.content?.slice(0, 500),
        rawContent: item.content,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        rank: index + 1,
        tags: item.categories?.filter((c): c is string => typeof c === 'string'),
      }))
      return { items }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { items: [], error: `RSS fetch failed: ${message}` }
    }
  },
}
