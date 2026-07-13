import * as cheerio from 'cheerio'
import type { Crawler, CrawlResult, RawItem } from './types'

function parseCount(value: string) {
  const normalized = value.replace(/,/g, '').trim()
  const match = normalized.match(/[\d.]+/)
  if (!match) return undefined
  const number = Number(match[0])
  if (!Number.isFinite(number)) return undefined
  return Math.round(number)
}

export const githubTrendingCrawler: Crawler = {
  name: 'GitHub Trending',
  type: 'html',

  async crawl(url: string): Promise<CrawlResult> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) HotTopicsAggregator/1.0',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        return { items: [], error: `GitHub Trending HTTP ${res.status}` }
      }

      const html = await res.text()
      const $ = cheerio.load(html)
      const items: RawItem[] = []

      $('article.Box-row').each((index, element) => {
        const $element = $(element)
        const repoPath = $element.find('h2 a').first().text().replace(/\s+/g, '').trim()
        if (!repoPath) return

        const repoUrl = new URL($element.find('h2 a').first().attr('href') ?? `/${repoPath}`, 'https://github.com').href
        const description = $element.find('p').first().text().replace(/\s+/g, ' ').trim()
        const language = $element.find('[itemprop="programmingLanguage"]').first().text().trim()
        const starsTodayText = $element.find('span.float-sm-right').first().text().replace(/\s+/g, ' ').trim()
        const starsText = $element.find('a[href$="/stargazers"]').first().text().replace(/\s+/g, ' ').trim()
        const forksText = $element.find('a[href$="/forks"]').first().text().replace(/\s+/g, ' ').trim()
        const starsToday = parseCount(starsTodayText)
        const stars = parseCount(starsText)
        const forks = parseCount(forksText)
        const heat = (starsToday ?? 0) * 100 + (stars ?? 0) + (forks ?? 0)

        items.push({
          title: repoPath,
          url: repoUrl,
          summary: description || undefined,
          score: stars,
          heat: heat || 1,
          rank: index + 1,
          tags: ['GitHub', '开源', language].filter(Boolean),
        })
      })

      return { items }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { items: [], error: `GitHub Trending fetch failed: ${message}` }
    }
  },
}
