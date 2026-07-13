import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface HotItemFilters {
  region?: string; category?: string; aiSubcategory?: string; sourceId?: string
  search?: string; language?: string; sort?: 'collectedAt' | 'heat' | 'score' | 'publishedAt'
  limit?: number; offset?: number
}

const SHANGHAI_UTC_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function getShanghaiDayRange(now = new Date()) {
  const shanghaiNow = new Date(now.getTime() + SHANGHAI_UTC_OFFSET_MS)
  const start = new Date(
    Date.UTC(
      shanghaiNow.getUTCFullYear(),
      shanghaiNow.getUTCMonth(),
      shanghaiNow.getUTCDate()
    ) - SHANGHAI_UTC_OFFSET_MS
  )

  return { start, end: new Date(start.getTime() + DAY_MS) }
}

export async function getHotItems(filters: HotItemFilters = {}) {
  const { region, category, aiSubcategory, sourceId, search, language, sort = 'collectedAt', limit = 50, offset = 0 } = filters
  const where: Prisma.HotItemWhereInput = {}
  if (region) where.region = region
  if (category) where.category = category
  if (aiSubcategory) where.aiSubcategory = aiSubcategory
  if (sourceId) where.sourceId = sourceId
  if (language) where.language = language
  if (search) where.OR = [{ title: { contains: search } }, { summary: { contains: search } }, { tags: { contains: search } }]
  const orderBy: Prisma.HotItemOrderByWithRelationInput = sort === 'heat' ? { heat: 'desc' } : sort === 'score' ? { score: 'desc' } : sort === 'publishedAt' ? { publishedAt: 'desc' } : { collectedAt: 'desc' }
  const [items, total] = await Promise.all([prisma.hotItem.findMany({ where, orderBy, take: limit, skip: offset, include: { source: { select: { name: true, slug: true, region: true } } } }), prisma.hotItem.count({ where })])
  return { items, total }
}

export async function getDailyHotItems(limit = 100) {
  const { start, end } = getShanghaiDayRange()

  return prisma.hotItem.findMany({
    where: { collectedAt: { gte: start, lt: end } },
    orderBy: [{ heat: 'desc' }, { score: 'desc' }, { collectedAt: 'desc' }],
    take: limit,
    include: { source: { select: { name: true, slug: true, region: true } } },
  })
}

export async function getGithubDailyHotItems(limit = 50) {
  const { start, end } = getShanghaiDayRange()
  const sourceWhere: Prisma.HotItemWhereInput = { source: { slug: 'github-trending-daily' } }
  const include = { source: { select: { name: true, slug: true, region: true } } } as const
  const orderBy: Prisma.HotItemOrderByWithRelationInput[] = [
    { rank: 'asc' },
    { heat: 'desc' },
  ]

  const todayItems = await prisma.hotItem.findMany({
    where: { ...sourceWhere, collectedAt: { gte: start, lt: end } },
    orderBy,
    take: limit,
    include,
  })

  if (todayItems.length > 0) return todayItems

  return prisma.hotItem.findMany({
    where: sourceWhere,
    orderBy,
    take: limit,
    include,
  })
}

export async function getHotItemById(id: string) { return prisma.hotItem.findUnique({ where: { id }, include: { source: true, crawlRun: true } }) }

export async function getDashboardStats() {
  const [totalItems, chinaItems, globalItems, aiItems, sourceCount, lastCrawl] = await Promise.all([
    prisma.hotItem.count(), prisma.hotItem.count({ where: { region: 'china' } }), prisma.hotItem.count({ where: { region: 'global' } }),
    prisma.hotItem.count({ where: { category: 'ai' } }), prisma.source.count({ where: { enabled: true } }),
    prisma.crawlRun.findFirst({ orderBy: { startedAt: 'desc' }, select: { startedAt: true } })
  ])
  return { totalItems, chinaItems, globalItems, aiItems, sourceCount, lastCrawlAt: lastCrawl?.startedAt ?? null }
}

export async function getAiSubcategoryStats() {
  const items = await prisma.hotItem.findMany({ where: { category: 'ai', aiSubcategory: { not: null } }, select: { aiSubcategory: true } })
  const counts: Record<string, number> = {}
  for (const item of items) { const sub = item.aiSubcategory ?? 'other'; counts[sub] = (counts[sub] ?? 0) + 1 }
  return Object.entries(counts).sort(([,a],[,b]) => b - a).map(([subcategory, count]) => ({ subcategory, count }))
}

export async function getCategoryStats() { const items = await prisma.hotItem.groupBy({ by: ['category'], _count: true }); return items.sort((a,b) => b._count - a._count).map(i => ({ category: i.category, count: i._count })) }
export async function getRegionStats() { const items = await prisma.hotItem.groupBy({ by: ['region'], _count: true }); return items.map(i => ({ region: i.region, count: i._count })) }

export async function getHotItemsByHour() {
  const now = new Date(); const hours: { hour: string; count: number }[] = []
  for (let i = 23; i >= 0; i--) { const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0); const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 59, 59); hours.push({ hour: `${i}:00`, count: await prisma.hotItem.count({ where: { collectedAt: { gte: start, lte: end } } }) }) }
  return hours
}

export async function getSources() { return prisma.source.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { items: true, crawlRuns: true } } } }) }
export async function getCrawlRuns(limit = 50) { return prisma.crawlRun.findMany({ orderBy: { startedAt: 'desc' }, take: limit, include: { source: { select: { name: true, slug: true } } } }) }
