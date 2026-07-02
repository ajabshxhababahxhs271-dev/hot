export interface RawItem {
  title: string
  url: string
  summary?: string
  rawContent?: string
  score?: number
  rank?: number
  heat?: number
  publishedAt?: Date
  tags?: string[]
}

export interface CrawlResult {
  items: RawItem[]
  error?: string
}

export interface Crawler {
  name: string
  type: 'rss' | 'api' | 'html' | 'playwright' | 'manual'
  crawl(url: string): Promise<CrawlResult>
}
