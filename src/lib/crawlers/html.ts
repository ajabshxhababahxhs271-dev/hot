import * as cheerio from 'cheerio'
import type { Crawler, CrawlResult, RawItem } from './types'

export interface HtmlCrawlerConfig {
  itemSelector: string
  titleSelector: string
  linkSelector?: string
  summarySelector?: string
  scoreSelector?: string
}

export function createHtmlCrawler(config: HtmlCrawlerConfig): Crawler {
  return {
    name: 'HTML Crawler',
    type: 'html',

    async crawl(url: string): Promise<CrawlResult> {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) HotTopicsAggregator/1.0',
            Accept: 'text/html',
          },
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) {
          return { items: [], error: `HTTP ${res.status}: ${res.statusText} from ${url}` }
        }
        const html = await res.text()
        const $ = cheerio.load(html)
        const items: RawItem[] = []
        $(config.itemSelector).each((i, el) => {
          const $el = $(el)
          const title = $el.find(config.titleSelector).first().text().trim() || $el.text().trim().slice(0, 120)
          let link = ''
          if (config.linkSelector) {
            link = $el.find(config.linkSelector).first().attr('href') ?? ''
          }
          if (link && !link.startsWith('http')) {
            try { link = new URL(link, url).href } catch { link = url }
          }
          const summary = config.summarySelector ? $el.find(config.summarySelector).first().text().trim().slice(0, 500) : undefined
          const scoreText = config.scoreSelector ? $el.find(config.scoreSelector).first().text().trim() : undefined
          const score = scoreText ? parseInt(scoreText.replace(/[^0-9]/g, ''), 10) || undefined : undefined
          if (title) {
            items.push({ title, url: link || url, summary, score, rank: i + 1 })
          }
        })
        return { items }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { items: [], error: `HTML fetch failed: ${message}` }
      }
    },
  }
}

export const hackerNewsCrawler = createHtmlCrawler({
  itemSelector: 'tr.athing',
  titleSelector: 'td.title .titleline > a',
  linkSelector: 'td.title .titleline > a',
  scoreSelector: '.score',
})
