import Link from 'next/link'
import { History, Search } from 'lucide-react'
import { HotItemList } from '@/components/hot-items/hot-item-list'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSourceOptions, searchHotItems, type SearchHotItemFilters } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const CATEGORIES = [
  ['ai', 'AI'], ['tech', '科技'], ['finance', '财经'], ['business', '商业'],
  ['society', '社会'], ['entertainment', '娱乐'], ['sports', '体育'],
  ['politics', '政治'], ['research', '研究'], ['other', '其他'],
]

type Params = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function paginationHref(params: Params, page: number) {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const selected = first(value)
    if (selected && key !== 'page') next.set(key, selected)
  }
  if (page > 1) next.set('page', String(page))
  const query = next.toString()
  return query ? `/search?${query}` : '/search'
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const query = first(params.q) ?? ''
  const region = first(params.region) ?? ''
  const category = first(params.category) ?? ''
  const sourceId = first(params.sourceId) ?? ''
  const from = first(params.from) ?? ''
  const to = first(params.to) ?? ''
  const sort = first(params.sort) === 'heat' || first(params.sort) === 'publishedAt'
    ? first(params.sort) as SearchHotItemFilters['sort']
    : 'relevance'
  const parsedPage = Number(first(params.page) ?? '1')
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const [result, sources] = await Promise.all([
    searchHotItems({ query, region: region || undefined, category: category || undefined, sourceId: sourceId || undefined, from: from || undefined, to: to || undefined, sort, page }),
    getSourceOptions(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><History className="h-5 w-5" />历史热点</h1>
        <p className="text-sm text-muted-foreground mt-1">搜索已采集的标题、摘要、标签和来源，共 {result.total} 条结果</p>
      </div>

      <form className="rounded-lg border bg-card p-4 space-y-3" action="/search">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input name="q" defaultValue={query} placeholder="搜索历史热点……" className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input type="date" name="from" defaultValue={from} aria-label="开始日期" className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm" />
          <input type="date" name="to" defaultValue={to} aria-label="结束日期" className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm" />
          <select name="region" defaultValue={region} aria-label="地区" className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm">
            <option value="">全部地区</option><option value="china">国内</option><option value="global">国际</option>
          </select>
          <select name="category" defaultValue={category} aria-label="分类" className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm">
            <option value="">全部分类</option>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select name="sourceId" defaultValue={sourceId} aria-label="数据源" className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm">
            <option value="">全部数据源</option>{sources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
          <select name="sort" defaultValue={sort} aria-label="排序" className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm">
            <option value="relevance">相关度</option><option value="heat">热度</option><option value="publishedAt">发布时间</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonVariants()}>搜索</button>
          <Link href="/search" className={buttonVariants({ variant: 'outline' })}>清除筛选</Link>
        </div>
      </form>

      <HotItemList items={result.items} emptyMessage="没有找到符合条件的历史热点" />

      {result.pageCount > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="搜索结果分页">
          <Link href={paginationHref(params, Math.max(result.page - 1, 1))} aria-disabled={result.page <= 1} className={cn(buttonVariants({ variant: 'outline' }), result.page <= 1 && 'pointer-events-none opacity-50')}>上一页</Link>
          <span className="text-sm text-muted-foreground">第 {result.page} / {result.pageCount} 页</span>
          <Link href={paginationHref(params, Math.min(result.page + 1, result.pageCount))} aria-disabled={result.page >= result.pageCount} className={cn(buttonVariants({ variant: 'outline' }), result.page >= result.pageCount && 'pointer-events-none opacity-50')}>下一页</Link>
        </nav>
      )}
    </div>
  )
}
