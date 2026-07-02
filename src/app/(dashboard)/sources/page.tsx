import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSources } from '@/lib/data'
import { Radio, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatInterval } from '@/lib/scheduler'

export const dynamic = 'force-dynamic'; export const revalidate = 120

const statusIcons: Record<string, React.ReactNode> = { idle: <Clock className="h-4 w-4 text-muted-foreground" />, running: <Clock className="h-4 w-4 text-blue-500 animate-pulse" />, success: <CheckCircle2 className="h-4 w-4 text-green-500" />, failed: <XCircle className="h-4 w-4 text-red-500" /> }
const statusBadge: Record<string, { label: string; className: string }> = { idle: { label: '待采集', className: 'bg-gray-100 text-gray-700' }, running: { label: '采集中', className: 'bg-blue-100 text-blue-700' }, success: { label: '正常', className: 'bg-green-100 text-green-700' }, failed: { label: '失败', className: 'bg-red-100 text-red-700' } }

export default async function SourcesPage() {
  const sources = await getSources()
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Radio className="h-5 w-5" />数据源管理</h1><p className="text-sm text-muted-foreground mt-1">{sources.filter(s=>s.enabled).length} 个启用</p></div>
      <div className="grid gap-4">{sources.map(source => {
        const st = statusBadge[source.lastStatus] ?? statusBadge.idle
        const ic = statusIcons[source.lastStatus] ?? statusIcons.idle
        return <Card key={source.id} className={cn(!source.enabled && 'opacity-60')}><CardContent className="p-4"><div className="flex items-start justify-between gap-4"><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h3 className="font-semibold text-sm">{source.name}</h3><Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{source.type}</Badge><Badge variant="outline" className={source.region==='china'?'text-[10px] px-1.5 py-0 bg-red-50 text-red-700':'text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700'}>{source.region==='china'?'国内':'国际'}</Badge>{!source.enabled && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">禁用</Badge>}</div><p className="text-xs text-muted-foreground mt-1 font-mono truncate">{source.url}</p><div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground"><span>频率: {formatInterval(source.fetchIntervalMinutes)}</span><span>累计: {source.itemCount} 条</span><span>采集: {source._count.crawlRuns} 次</span>{source.lastSuccessAt && <span>最近: {new Date(source.lastSuccessAt).toLocaleString('zh-CN')}</span>}</div>{source.lastError && <div className="mt-2 flex gap-1.5 text-xs text-red-600 bg-red-50 rounded p-2"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /><span className="break-all">{source.lastError}</span></div>}</div><div className="flex flex-col items-end gap-1 shrink-0"><Badge className={cn('text-[10px]',st.className)}><span className="flex items-center gap-1">{ic}{st.label}</span></Badge><span className="text-[10px] text-muted-foreground">{source._count.items} items</span></div></div></CardContent></Card>
      })}</div>
    </div>
  )
}
