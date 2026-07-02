import { FilterBar } from '@/components/hot-items/filter-bar'
import { HotItemList } from '@/components/hot-items/hot-item-list'
import { getHotItems } from '@/lib/data'
import { Flag } from 'lucide-react'
import type { HotItemFilters } from '@/lib/data'

export const dynamic = 'force-dynamic'; export const revalidate = 60

function parseSort(value: string | undefined): HotItemFilters['sort'] {
  return value === 'heat' || value === 'score' || value === 'publishedAt' ? value : 'collectedAt'
}

export default async function ChinaPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | undefined }> }) {
  const p = await searchParams
  const { items, total } = await getHotItems({ region: 'china', category: p.category !== 'all' ? p.category : undefined, sort: parseSort(p.sort), search: p.search, limit: 50 })
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Flag className="h-5 w-5 text-red-500" />国内热点</h1><p className="text-sm text-muted-foreground mt-1">{total} 条国内热点</p></div>
      <FilterBar showRegion={false} defaultRegion="china" />
      <HotItemList items={items} emptyMessage="暂无国内热点数据" />
    </div>
  )
}
