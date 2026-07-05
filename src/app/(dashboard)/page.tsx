import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { HotItemList } from '@/components/hot-items/hot-item-list'
import { CollectChart } from '@/components/dashboard/collect-chart'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { getDashboardStats, getHotItems, getCategoryStats, getHotItemsByHour } from '@/lib/data'
import { Globe, Flag, Cpu, Radio, Zap } from 'lucide-react'
import { formatTime } from '@/lib/format-date'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function HomePage() {
  const [stats, latest, categories, hourly] = await Promise.all([
    getDashboardStats(), getHotItems({ limit: 20 }), getCategoryStats(), getHotItemsByHour(),
  ])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />实时热点总览</h1>
        <p className="text-sm text-muted-foreground mt-1">{stats.sourceCount} 个数据源 · {stats.totalItems} 条热点 · 每 60 秒自动刷新</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="总热点数" value={stats.totalItems.toLocaleString()} subtitle="累计采集" icon={<Zap className="h-4 w-4" />} />
        <StatCard title="国内热点" value={stats.chinaItems.toLocaleString()} subtitle="china" icon={<Flag className="h-4 w-4" />} />
        <StatCard title="国际热点" value={stats.globalItems.toLocaleString()} subtitle="global" icon={<Globe className="h-4 w-4" />} />
        <StatCard title="AI 热点" value={stats.aiItems.toLocaleString()} subtitle="AI" icon={<Cpu className="h-4 w-4" />} />
        <StatCard title="数据源" value={stats.sourceCount.toString()} subtitle={stats.lastCrawlAt ? `最近: ${formatTime(stats.lastCrawlAt)}` : '尚未采集'} icon={<Radio className="h-4 w-4" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><CollectChart data={hourly} /></div>
        <div><Suspense fallback={<Skeleton className="h-[300px]" />}><CategoryBreakdown data={categories} title="分类分布" /></Suspense></div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-3">最新热点</h2>
        <HotItemList items={latest.items} emptyMessage="暂无热点数据，请先运行 npx tsx scripts/crawl.ts" />
      </div>
    </div>
  )
}
