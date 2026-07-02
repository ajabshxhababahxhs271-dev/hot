import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Terminal, Clock } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-5 w-5" />系统设置</h1></div>
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />定时采集</CardTitle></CardHeader><CardContent className="space-y-3"><div><h4 className="text-sm font-medium">本地 (node-cron)</h4><pre className="mt-1 bg-muted p-2 rounded-md text-xs"><code>npx tsx scripts/scheduler.ts</code></pre></div><div><h4 className="text-sm font-medium">Vercel Cron</h4><pre className="mt-1 bg-muted p-2 rounded-md text-xs"><code>{`{"crons":[{"path":"/api/cron/crawl","schedule":"*/10 * * * *"}]}`}</code></pre></div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Terminal className="h-4 w-4" />手动采集</CardTitle></CardHeader><CardContent className="space-y-2"><div><p className="text-sm font-medium">所有数据源</p><pre className="mt-1 bg-muted p-2 rounded-md text-xs"><code>npx tsx scripts/crawl.ts</code></pre></div><div><p className="text-sm font-medium">单个数据源</p><pre className="mt-1 bg-muted p-2 rounded-md text-xs"><code>npx tsx scripts/crawl.ts hacker-news</code></pre></div></CardContent></Card>
    </div>
  )
}
