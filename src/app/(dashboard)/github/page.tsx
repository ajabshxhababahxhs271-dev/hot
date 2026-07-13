import { HotItemList } from '@/components/hot-items/hot-item-list'
import { getGithubDailyHotItems } from '@/lib/data'
import { GitFork } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function GithubPage() {
  const items = await getGithubDailyHotItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GitFork className="h-5 w-5" />GitHub 每日热搜榜
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{items.length} 个每日热门开源项目</p>
      </div>
      <HotItemList items={items} emptyMessage="暂无数据，请等待 GitHub 每日趋势源完成采集" />
    </div>
  )
}
