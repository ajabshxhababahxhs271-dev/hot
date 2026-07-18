import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCrawlRuns, getCronInvocations } from '@/lib/data'
import { ListChecks, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format-date'

export const dynamic = 'force-dynamic'; export const revalidate = 60

const cfg: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  registered: { icon: <Clock className="h-3.5 w-3.5" />, className: 'bg-slate-100 text-slate-700', label: '已注册' },
  running: { icon: <Clock className="h-3.5 w-3.5 animate-pulse" />, className: 'bg-blue-100 text-blue-700', label: '运行中' },
  success: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: 'bg-green-100 text-green-700', label: '成功' },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, className: 'bg-red-100 text-red-700', label: '失败' },
  partial: { icon: <AlertTriangle className="h-3.5 w-3.5" />, className: 'bg-yellow-100 text-yellow-700', label: '部分' },
}

export default async function CrawlLogPage() {
  const [runs, invocations] = await Promise.all([getCrawlRuns(50), getCronInvocations(20)])
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ListChecks className="h-5 w-5" />采集日志</h1><p className="text-sm text-muted-foreground mt-1">最近 {runs.length} 次数据源采集记录</p></div>
      <section className="space-y-2"><div><h2 className="text-base font-semibold">定时任务</h2><p className="text-xs text-muted-foreground mt-1">记录 cron 请求是否成功注册后台任务，以及任务完成或异常摘要。</p></div>
        {invocations.length === 0 ? <p className="text-sm text-muted-foreground py-4">暂无定时任务记录</p> : <div className="space-y-2">{invocations.map(invocation => { const c = cfg[invocation.status] ?? cfg.failed; const dur = invocation.finishedAt && invocation.startedAt ? Math.round((new Date(invocation.finishedAt).getTime() - new Date(invocation.startedAt).getTime()) / 1000) : null
          return <Card key={invocation.id}><CardContent className="p-4"><div className="flex items-center justify-between gap-4"><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium text-sm">cron 后台采集</span><Badge className={cn('text-[10px] px-1.5 py-0', c.className)}><span className="flex items-center gap-1">{c.icon}{c.label}</span></Badge><Badge variant="outline" className="text-[10px] px-1.5 py-0">{invocation.mode === 'background' ? '异步' : '同步'}</Badge></div><div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground"><span>{formatDateTime(invocation.requestedAt)}</span>{dur !== null && <span>{dur}s</span>}<span>上限{invocation.sourceLimit} · 已采集{invocation.sourceCount} · 新增{invocation.newItems} · 跳过{invocation.skippedItems}</span></div>{invocation.status === 'registered' && <p className="mt-1 text-xs text-amber-700">已接受请求，等待后台任务开始；若长期停留在此状态，表示任务可能在启动前被中断。</p>}{invocation.errorMessage && <p className="mt-1 text-xs text-red-600 whitespace-pre-wrap break-words">{invocation.errorMessage}</p>}</div></div></CardContent></Card>
        })}</div>}
      </section>
      <section className="space-y-2"><h2 className="text-base font-semibold">数据源采集</h2>
      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20"><div className="text-4xl mb-3">📋</div><p className="text-muted-foreground">暂无采集记录</p></div>
      ) : (
        <div className="space-y-2">{runs.map(run => { const c = cfg[run.status] ?? cfg.failed; const dur = run.finishedAt ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000) : null
          return <Card key={run.id}><CardContent className="p-4"><div className="flex items-center justify-between gap-4"><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium text-sm">{run.source.name}</span><Badge className={cn('text-[10px] px-1.5 py-0', c.className)}><span className="flex items-center gap-1">{c.icon}{c.label}</span></Badge></div><div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground"><span>{formatDateTime(run.startedAt)}</span>{dur !== null && <span>{dur}s</span>}<span>共{run.itemCount} · 新增{run.newItems} · 跳过{run.skippedItems}</span></div>{run.errorMessage && <p className="mt-1 text-xs text-red-600 truncate">{run.errorMessage}</p>}</div></div></CardContent></Card>
        })}</div>
      )}</section>
    </div>
  )
}
