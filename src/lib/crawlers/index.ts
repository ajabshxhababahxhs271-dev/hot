import type { Crawler } from './types'
import { rssCrawler } from './rss'
import { createHtmlCrawler, hackerNewsCrawler, type HtmlCrawlerConfig } from './html'
import { createApiCrawler, type ApiCrawlerConfig } from './api'
import { bilibiliCrawler } from './bilibili'
import { baiduCrawler } from './baidu'
import { juejinCrawler } from './juejin'
import { githubTrendingCrawler } from './github-trending'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typeRegistry: Record<string, any> = {
  rss: rssCrawler,
  html: (config?: HtmlCrawlerConfig) => {
    if (!config) throw new Error('HTML crawler requires selector config')
    return createHtmlCrawler(config)
  },
  api: (config?: ApiCrawlerConfig) => {
    if (!config) throw new Error('API crawler requires fieldMap config')
    return createApiCrawler(config)
  },
  bilibili: bilibiliCrawler,
  baidu: baiduCrawler,
  juejin: juejinCrawler,
  githubTrending: githubTrendingCrawler,
  hackerNews: hackerNewsCrawler,
}

// ─── Slug-based registry (source-specific crawlers) ───
const slugRegistry: Record<string, Crawler> = {
  'hacker-news': hackerNewsCrawler,
  'bilibili-hot': bilibiliCrawler,
  'baidu-hot': baiduCrawler,
  'juejin-hot': juejinCrawler,
  'github-trending-daily': githubTrendingCrawler,
}

// ─── Slug-based API configs (for sources using the api type) ──
const slugApiConfigs: Record<string, ApiCrawlerConfig> = {
  // B站热门 (handled by bilibiliCrawler directly, not this config)
}

/**
 * Get a crawler for a source. Checks slug registry first, then type registry.
 */
export function getCrawler(
  sourceType: string,
  sourceSlug?: string,
  config?: HtmlCrawlerConfig | ApiCrawlerConfig
): Crawler | null {
  // 1. Check slug-specific crawler
  if (sourceSlug && slugRegistry[sourceSlug]) {
    return slugRegistry[sourceSlug]
  }

  // 2. Check type registry
  const entry = typeRegistry[sourceType]
  if (!entry) return null

  if (typeof entry === 'function') {
    // For API type, check slug-specific configs
    if (sourceType === 'api' && sourceSlug && slugApiConfigs[sourceSlug]) {
      return (entry as (c?: ApiCrawlerConfig) => Crawler)(slugApiConfigs[sourceSlug])
    }
    if (config) return (entry as (c?: unknown) => Crawler)(config)
    return (entry as () => Crawler)()
  }

  return entry
}

export function listCrawlerTypes(): string[] {
  return Object.keys(typeRegistry)
}

export function listSlugCrawlers(): string[] {
  return Object.keys(slugRegistry)
}

export type { Crawler, CrawlResult, RawItem } from './types'
export { rssCrawler } from './rss'
export { createHtmlCrawler, hackerNewsCrawler, type HtmlCrawlerConfig } from './html'
export { createApiCrawler, type ApiCrawlerConfig } from './api'
export { bilibiliCrawler } from './bilibili'
export { githubTrendingCrawler } from './github-trending'
