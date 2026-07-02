// ─── API Crawler — Generic JSON API support ──────────

import type { Crawler, CrawlResult, RawItem } from './types'

export interface ApiCrawlerConfig {
  /** Path to the array of items in the JSON response (e.g. "data.list" or "data") */
  itemsPath?: string
  /** Field mapping: RawItem key → JSON field path */
  fieldMap: {
    title: string
    url?: string
    summary?: string
    score?: string
    heat?: string
    rank?: string
    publishedAt?: string
    tags?: string
  }
  /** Optional: transform a raw item before returning */
  transform?: (item: Record<string, unknown>) => Partial<RawItem>
  /** Optional: custom headers */
  headers?: Record<string, string>
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((cur: unknown, key) => {
    if (cur && typeof cur === 'object') return (cur as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function getString(obj: Record<string, unknown>, path: string | undefined): string | undefined {
  if (!path) return undefined
  const val = getNested(obj, path)
  return val != null ? String(val) : undefined
}

function getNumber(obj: Record<string, unknown>, path: string | undefined): number | undefined {
  if (!path) return undefined
  const val = getNested(obj, path)
  if (typeof val === 'number') return val
  if (typeof val === 'string') { const n = parseInt(val, 10); return isNaN(n) ? undefined : n }
  return undefined
}

export function createApiCrawler(config: ApiCrawlerConfig): Crawler {
  const { itemsPath, fieldMap, transform, headers } = config

  return {
    name: 'API Crawler',
    type: 'api',

    async crawl(url: string): Promise<CrawlResult> {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) HotTopicsAggregator/1.0',
            Accept: 'application/json',
            ...headers,
          },
          signal: AbortSignal.timeout(15000),
        })

        if (!res.ok) {
          return { items: [], error: `API HTTP ${res.status} from ${url}` }
        }

        const json = await res.json() as Record<string, unknown>

        // Navigate to the items array
        let itemsArray: unknown[] = []
        if (itemsPath) {
          const found = getNested(json, itemsPath)
          itemsArray = Array.isArray(found) ? found : []
        } else if (Array.isArray(json)) {
          itemsArray = json
        } else {
          // Search for the first array in the response
          for (const val of Object.values(json)) {
            if (Array.isArray(val)) { itemsArray = val; break }
          }
        }

        const items: RawItem[] = itemsArray.map((raw, index) => {
          const obj = raw as Record<string, unknown>

          const base: RawItem = {
            title: getString(obj, fieldMap.title) ?? `Item ${index + 1}`,
            url: getString(obj, fieldMap.url ?? 'url') ?? url,
            summary: getString(obj, fieldMap.summary ?? ''),
            score: getNumber(obj, fieldMap.score),
            heat: getNumber(obj, fieldMap.heat),
            rank: getNumber(obj, fieldMap.rank) ?? index + 1,
            publishedAt: getString(obj, fieldMap.publishedAt) ? new Date(getString(obj, fieldMap.publishedAt)!) : undefined,
            tags: getString(obj, fieldMap.tags)?.split(',').map(t => t.trim()).filter(Boolean),
          }

          if (transform) {
            Object.assign(base, transform(obj))
          }

          return base
        })

        return { items }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { items: [], error: `API fetch failed: ${message}` }
      }
    },
  }
}
