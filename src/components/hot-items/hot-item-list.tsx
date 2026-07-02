import { HotItemCard } from './hot-item-card'
import type { HotItem } from '@prisma/client'

type HotItemWithSource = HotItem & { source: { name: string; slug: string; region: string } }

export function HotItemList({ items, emptyMessage = '暂无数据' }: { items: HotItemWithSource[]; emptyMessage?: string }) {
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-muted-foreground">{emptyMessage}</p>
      <p className="text-xs text-muted-foreground mt-1">请等待数据采集或检查数据源状态</p>
    </div>
  )
  return <div className="grid gap-3">{items.map(item => <HotItemCard key={item.id} item={item} />)}</div>
}
