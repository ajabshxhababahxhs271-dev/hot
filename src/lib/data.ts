import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface HotItemFilters {
  region?: string; category?: string; aiSubcategory?: string; sourceId?: string
  search?: string; language?: string; sort?: 'collectedAt' | 'heat' | 'score' | 'publishedAt'
  limit?: number; offset?: number
}

export interface SearchHotItemFilters {
  query?: string
  from?: string
  to?: string
  region?: string
  category?: string
  sourceId?: string
  sort?: 'relevance' | 'heat' | 'publishedAt'
  page?: number
  pageSize?: number
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

function parseShanghaiDate(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined

  const [, year, month, day] = match
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)) - SHANGHAI_UTC_OFFSET_MS
  )
  const shanghaiDate = new Date(date.getTime() + SHANGHAI_UTC_OFFSET_MS)

  if (
    shanghaiDate.getUTCFullYear() !== Number(year) ||
    shanghaiDate.getUTCMonth() !== Number(month) - 1 ||
    shanghaiDate.getUTCDate() !== Number(day)
  ) return undefined

  return date
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
    where: {
      collectedAt: { gte: start, lt: end },
      category: { not: 'entertainment' },
    },
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

export async function searchHotItems(filters: SearchHotItemFilters = {}) {
  const query = filters.query?.trim() ?? ''
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100)
  const page = Math.max(filters.page ?? 1, 1)
  const skip = (page - 1) * pageSize
  const from = parseShanghaiDate(filters.from)
  const to = parseShanghaiDate(filters.to)
  const toExclusive = to ? new Date(to.getTime() + DAY_MS) : undefined
  const where: Prisma.HotItemWhereInput = {}

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { summary: { contains: query, mode: 'insensitive' } },
      { tags: { contains: query, mode: 'insensitive' } },
      { sourceName: { contains: query, mode: 'insensitive' } },
    ]
  }
  if (from || toExclusive) where.collectedAt = { ...(from ? { gte: from } : {}), ...(toExclusive ? { lt: toExclusive } : {}) }
  if (filters.region) where.region = filters.region
  if (filters.category) where.category = filters.category
  if (filters.sourceId) where.sourceId = filters.sourceId

  const include = { source: { select: { name: true, slug: true, region: true } } } as const
  const total = await prisma.hotItem.count({ where })

  if (filters.sort !== 'relevance' || !query) {
    const orderBy: Prisma.HotItemOrderByWithRelationInput[] = filters.sort === 'publishedAt'
      ? [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { collectedAt: 'desc' }]
      : filters.sort === 'heat'
        ? [{ heat: 'desc' }, { collectedAt: 'desc' }]
        : [{ collectedAt: 'desc' }]
    const items = await prisma.hotItem.findMany({ where, orderBy, skip, take: pageSize, include })
    return { items, total, page, pageSize, pageCount: Math.max(Math.ceil(total / pageSize), 1) }
  }

  const pattern = `%${query}%`
  const prefixPattern = `${query}%`
  const clauses: Prisma.Sql[] = [Prisma.sql`(
    "title" ILIKE ${pattern} OR
    COALESCE("summary", '') ILIKE ${pattern} OR
    "tags" ILIKE ${pattern} OR
    "sourceName" ILIKE ${pattern}
  )`]
  if (from) clauses.push(Prisma.sql`"collectedAt" >= ${from}`)
  if (toExclusive) clauses.push(Prisma.sql`"collectedAt" < ${toExclusive}`)
  if (filters.region) clauses.push(Prisma.sql`"region" = ${filters.region}`)
  if (filters.category) clauses.push(Prisma.sql`"category" = ${filters.category}`)
  if (filters.sourceId) clauses.push(Prisma.sql`"sourceId" = ${filters.sourceId}`)

  const rankedIds = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "HotItem"
    WHERE ${Prisma.join(clauses, ' AND ')}
    ORDER BY
      CASE
        WHEN LOWER("title") = LOWER(${query}) THEN 100
        WHEN "title" ILIKE ${prefixPattern} THEN 80
        WHEN "title" ILIKE ${pattern} THEN 60
        WHEN "sourceName" ILIKE ${pattern} THEN 40
        WHEN "tags" ILIKE ${pattern} THEN 30
        ELSE 20
      END DESC,
      "heat" DESC,
      "collectedAt" DESC
    LIMIT ${pageSize}
    OFFSET ${skip}
  `)
  const ids = rankedIds.map(item => item.id)
  const unorderedItems = ids.length > 0
    ? await prisma.hotItem.findMany({ where: { id: { in: ids } }, include })
    : []
  const byId = new Map(unorderedItems.map(item => [item.id, item]))
  const items = ids.flatMap(id => {
    const item = byId.get(id)
    return item ? [item] : []
  })

  return { items, total, page, pageSize, pageCount: Math.max(Math.ceil(total / pageSize), 1) }
}

export async function getSourceOptions() {
  return prisma.source.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
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
