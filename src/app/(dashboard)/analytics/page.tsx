import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CollectChart } from '@/components/dashboard/collect-chart'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { getDashboardStats, getCategoryStats, getRegionStats, getHotItemsByHour, getAiSubcategoryStats } from '@/lib/data'
import { BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'; export const revalidate = 120

export default async function AnalyticsPage() {
  const [stats, categories, regions, hourly, aiStats] = await Promise.all([getDashboardStats(), getCategoryStats(), getRegionStats(), getHotItemsByHour(), getAiSubcategoryStats()])
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="h-5 w-5" />趋势分析</h1><p className="text-sm text-muted-foreground mt-1">{stats.totalItems} 条热点 · {stats.sourceCount} 个数据源</p></div>
      <div className="grid gap-6 lg:grid-cols-2"><CollectChart data={hourly} /><CategoryBreakdown data={categories} title="分类分布" /></div>
      <div className="grid gap-6 lg:grid-cols-2"><CategoryBreakdown data={regions} title="地区分布" /><CategoryBreakdown data={aiStats.map(s => ({ subcategory: s.subcategory, count: s.count }))} title="AI 子类分布" /></div>
      <Card><CardHeader><CardTitle className="text-sm font-medium">数据总览</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{label:'总热点',value:stats.totalItems},{label:'国内',value:stats.chinaItems},{label:'国际',value:stats.globalItems},{label:'AI',value:stats.aiItems},{label:'数据源',value:stats.sourceCount}].map(i=><div key={i.label}><dt className="text-xs text-muted-foreground">{i.label}</dt><dd className="text-2xl font-bold tabular-nums">{i.value.toLocaleString()}</dd></div>)}</dl></CardContent></Card>
    </div>
  )
}
