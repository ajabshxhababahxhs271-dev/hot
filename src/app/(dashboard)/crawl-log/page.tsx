import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCrawlRuns } from '@/lib/data'
import { ListChecks, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'; export const revalidate = 60

const cfg: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  running: { icon: <Clock className="h-3.5 w-3.5 animate-pulse" />, className: 'bg-blue-100 text-blue-700', label: '运行中' },
  success: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: 'bg-green-100 text-green-700', label: '成功' },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, className: 'bg-red-100 text-red-700', label: '失败' },
  partial: { icon: <AlertTriangle className="h-3.5 w-3.5" />, className: 'bg-yellow-100 text-yellow-700', label: '部分' },
}

export default async function CrawlLogPage() {
  const runs = await getCrawlRuns(50)
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ListChecks className="h-5 w-5" />采集日志</h1><p className="text-sm text-muted-foreground mt-1">最近 {runs.length} 次记录</p></div>
      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20"><div className="text-4xl mb-3">📋</div><p className="text-muted-foreground">暂无采集记录</p></div>
      ) : (
        <div className="space-y-2">{runs.map(run => { const c = cfg[run.status] ?? cfg.failed; const dur = run.finishedAt ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000) : null
          return <Card key={run.id}><CardContent className="p-4"><div className="flex items-center justify-between gap-4"><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium text-sm">{run.source.name}</span><Badge className={cn('text-[10px] px-1.5 py-0', c.className)}><span className="flex items-center gap-1">{c.icon}{c.label}</span></Badge></div><div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground"><span>{new Date(run.startedAt).toLocaleString('zh-CN')}</span>{dur !== null && <span>{dur}s</span>}<span>共{run.itemCount} · 新增{run.newItems} · 跳过{run.skippedItems}</span></div>{run.errorMessage && <p className="mt-1 text-xs text-red-600 truncate">{run.errorMessage}</p>}</div></div></CardContent></Card>
        })}</div>
      )}
    </div>
  )
}
