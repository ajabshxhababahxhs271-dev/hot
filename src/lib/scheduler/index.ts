import { prisma } from '@/lib/prisma'

export async function getScheduleStatus() {
  const sources = await prisma.source.findMany({ where: { enabled: true }, orderBy: { lastFetchedAt: 'asc' } })
  return sources.map(s => {
    const nextDueAt = s.lastFetchedAt ? new Date(s.lastFetchedAt.getTime() + s.fetchIntervalMinutes * 60 * 1000) : new Date()
    return { sourceId: s.id, slug: s.slug, name: s.name, lastFetchedAt: s.lastFetchedAt, lastSuccessAt: s.lastSuccessAt, lastStatus: s.lastStatus, nextDueAt, intervalMinutes: s.fetchIntervalMinutes, isOverdue: nextDueAt <= new Date() }
  })
}

export async function getDueSources() { return (await getScheduleStatus()).filter(s => s.isOverdue) }
export function getNextCrawlTime(lastFetchedAt: Date | null, intervalMinutes: number) { return lastFetchedAt ? new Date(lastFetchedAt.getTime() + intervalMinutes * 60 * 1000) : new Date() }
export function formatInterval(minutes: number) { return minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分钟` : ''}` }
