import { HotItemList } from '@/components/hot-items/hot-item-list'
import { getDailyHotItems } from '@/lib/data'
import { Flame } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function DailyPage() {
  const items = await getDailyHotItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />每日热搜榜
        </h1>
        <p className="text-sm text-muted-foreground mt-1">今日共 {items.length} 条非娱乐热点，按热度排序</p>
      </div>
      <HotItemList items={items} emptyMessage="今日暂无热点数据" />
    </div>
  )
}
