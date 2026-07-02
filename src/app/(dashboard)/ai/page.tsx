import { Suspense } from 'react'
import { FilterBar } from '@/components/hot-items/filter-bar'
import { HotItemList } from '@/components/hot-items/hot-item-list'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { getHotItems, getAiSubcategoryStats } from '@/lib/data'
import { Cpu } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { HotItemFilters } from '@/lib/data'

export const dynamic = 'force-dynamic'; export const revalidate = 60

function parseSort(value: string | undefined): HotItemFilters['sort'] {
  return value === 'heat' || value === 'score' || value === 'publishedAt' ? value : 'collectedAt'
}

export default async function AiPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | undefined }> }) {
  const p = await searchParams
  const [result, aiStats] = await Promise.all([
    getHotItems({ category: 'ai', region: p.region !== 'all' ? p.region : undefined, aiSubcategory: p.aiSub !== 'all' ? p.aiSub : undefined, sort: parseSort(p.sort), search: p.search, limit: 50 }),
    getAiSubcategoryStats(),
  ])
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Cpu className="h-5 w-5 text-purple-500" />AI 热点</h1><p className="text-sm text-muted-foreground mt-1">{result.total} 条 AI 热点</p></div>
      <FilterBar showAiSub defaultCategory="ai" />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3"><HotItemList items={result.items} emptyMessage="暂无 AI 热点数据" /></div>
        <div><Suspense fallback={<Skeleton className="h-[300px]" />}><CategoryBreakdown data={aiStats.map(s => ({ subcategory: s.subcategory, count: s.count }))} title="AI 子类分布" /></Suspense></div>
      </div>
    </div>
  )
}
