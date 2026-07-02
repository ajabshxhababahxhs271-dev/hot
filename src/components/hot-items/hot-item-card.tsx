import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Flame, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HotItem } from '@prisma/client'

const regionBadge: Record<string, { label: string; className: string }> = {
  china: { label: '国内', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  global: { label: '国际', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
}

const categoryLabels: Record<string, string> = { ai:'AI', tech:'科技', finance:'财经', business:'商业', society:'社会', entertainment:'娱乐', sports:'体育', politics:'政治', research:'研究', other:'其他' }
const aiSubLabels: Record<string, string> = { model:'大模型', product:'AI产品', company:'AI公司', research:'论文研究', funding:'投融资', policy:'政策监管', open_source:'开源', infra:'基础设施', application:'应用落地', other:'AI其他' }

interface Props { item: Pick<HotItem, 'id'|'title'|'url'|'region'|'category'|'aiSubcategory'|'heat'|'score'|'collectedAt'|'sourceName'|'tags'> }

function formatCollectedAt(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

export function HotItemCard({ item }: Props) {
  const region = regionBadge[item.region] ?? regionBadge.global
  const tags = item.tags ? item.tags.split(',').filter(Boolean) : []
  const collectedAt = formatCollectedAt(item.collectedAt)

  return (
    <Link href={`/hot-items/${item.id}`} className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', region.className)}>{region.label}</Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{categoryLabels[item.category] ?? item.category}</Badge>
            {item.aiSubcategory && <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">{aiSubLabels[item.aiSubcategory] ?? item.aiSubcategory}</Badge>}
          </div>
          {tags.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{tags.slice(0,5).map(tag => <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tag}</span>)}</div>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Flame className="h-3 w-3 text-orange-500" /><span className="tabular-nums">{item.heat}</span></div>
          {item.score > 0 && <div className="text-[10px] text-muted-foreground tabular-nums">{item.score} 分</div>}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{item.sourceName}</span>
        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{collectedAt}</span></div>
      </div>
    </Link>
  )
}
