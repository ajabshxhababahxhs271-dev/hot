import { FilterBar } from '@/components/hot-items/filter-bar'
import { HotItemList } from '@/components/hot-items/hot-item-list'
import { getHotItems } from '@/lib/data'
import { Globe } from 'lucide-react'
import type { HotItemFilters } from '@/lib/data'

export const dynamic = 'force-dynamic'; export const revalidate = 60

function parseSort(value: string | undefined): HotItemFilters['sort'] {
  return value === 'heat' || value === 'score' || value === 'publishedAt' ? value : 'collectedAt'
}

export default async function GlobalPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | undefined }> }) {
  const p = await searchParams
  const { items, total } = await getHotItems({ region: 'global', category: p.category !== 'all' ? p.category : undefined, sort: parseSort(p.sort), search: p.search, limit: 50 })
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Globe className="h-5 w-5 text-blue-500" />国际热点</h1><p className="text-sm text-muted-foreground mt-1">{total} 条国际热点</p></div>
      <FilterBar showRegion={false} defaultRegion="global" />
      <HotItemList items={items} emptyMessage="暂无国际热点数据" />
    </div>
  )
}
