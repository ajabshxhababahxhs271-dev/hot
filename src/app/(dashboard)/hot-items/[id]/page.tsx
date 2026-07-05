import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getHotItemById } from '@/lib/data'
import { ExternalLink, ArrowLeft, Flame, Clock, Globe, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format-date'

export const dynamic = 'force-dynamic'; export const revalidate = 60

const rb: Record<string, { label: string; className: string }> = { china: { label: '国内', className: 'bg-red-100 text-red-800' }, global: { label: '国际', className: 'bg-blue-100 text-blue-800' } }

export default async function HotItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getHotItemById(id)
  if (!item) notFound()
  const r = rb[item.region] ?? rb.global
  const tags = item.tags ? item.tags.split(',').filter(Boolean) : []
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回</Link>
      <Card>
        <CardHeader><CardTitle className="text-xl leading-snug">{item.title}</CardTitle><div className="flex flex-wrap items-center gap-2 mt-3"><Badge variant="outline" className={cn('text-xs', r.className)}>{r.label}</Badge><Badge variant="secondary" className="text-xs">{item.category}</Badge>{item.aiSubcategory && <Badge className="text-xs bg-purple-100 text-purple-800">{item.aiSubcategory}</Badge>}<Badge variant="outline" className="text-xs">{item.language==='zh'?'中文':'English'}</Badge></div></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">来源:</span><a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{item.sourceName}<ExternalLink className="h-3 w-3" /></a></div>
          <Separator />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /><dt className="text-muted-foreground">热度:</dt><dd className="font-semibold tabular-nums">{item.heat}</dd></div>
            <div className="flex items-center gap-2"><dt className="text-muted-foreground">评分:</dt><dd className="font-semibold tabular-nums">{item.score}</dd></div>
            {item.rank && <div className="flex items-center gap-2"><dt className="text-muted-foreground">排名:</dt><dd className="font-semibold tabular-nums">#{item.rank}</dd></div>}
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><dt className="text-muted-foreground">采集于:</dt><dd className="tabular-nums">{formatDateTime(item.collectedAt)}</dd></div>
            {item.publishedAt && <div className="flex items-center gap-2 col-span-2"><Globe className="h-4 w-4 text-muted-foreground" /><dt className="text-muted-foreground">发布于:</dt><dd className="tabular-nums">{formatDateTime(item.publishedAt)}</dd></div>}
          </dl>
          {tags.length > 0 && <><Separator /><div className="flex items-start gap-2"><Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div className="flex flex-wrap gap-1.5">{tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div></div></>}
          {item.summary && <><Separator /><div><h3 className="text-sm font-semibold mb-2">摘要</h3><p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p></div></>}
        </CardContent>
      </Card>
    </div>
  )
}
