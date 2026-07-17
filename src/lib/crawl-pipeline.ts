import { prisma } from '@/lib/prisma'
import { getCrawler } from '@/lib/crawlers'
import { classify, generateFingerprint, generateLegacyFingerprint } from '@/lib/classifier'
import type { Prisma } from '@prisma/client'
import { createHash } from 'node:crypto'

function tagSlug(tag: string) {
  const normalized = tag.toLowerCase().replace(/\s+/g, '-').slice(0, 80) || 'tag'
  const suffix = createHash('sha256').update(tag).digest('hex').slice(0, 8)
  return `${normalized}-${suffix}`
}

export async function runCrawlPipeline(sourceId: string) {
  const source = await prisma.source.findUnique({ where: { id: sourceId } })
  if (!source) throw new Error(`Source not found: ${sourceId}`)
  if (!source.enabled) throw new Error(`Source disabled: ${source.slug}`)

  const run = await prisma.crawlRun.create({ data: { sourceId, status: 'running', startedAt: new Date() } })
  await prisma.source.update({ where: { id: sourceId }, data: { lastStatus: 'running', lastFetchedAt: new Date() } })

  try {
    const crawler = getCrawler(source.type, source.slug)
    if (!crawler) throw new Error(`No crawler for type: ${source.type}`)
    const result = await crawler.crawl(source.url)
    if (result.error && result.items.length === 0) throw new Error(result.error)

    let newItems = 0, skippedItems = 0
    const rawItemsByFingerprint = new Map<string, typeof result.items[number]>()
    for (const raw of result.items) {
      rawItemsByFingerprint.set(generateFingerprint(raw.title, raw.url), raw)
    }
    const rawItems = Array.from(rawItemsByFingerprint.values())
    const fingerprints = rawItems.flatMap(raw => [generateFingerprint(raw.title, raw.url), generateLegacyFingerprint(raw.title, raw.url)])
    const existingItems = await prisma.hotItem.findMany({ where: { fingerprint: { in: fingerprints } } })
    const existingByFingerprint = new Map(existingItems.map(item => [item.fingerprint, item]))
    const newRows: Prisma.HotItemCreateManyInput[] = []
    const updates: Array<{ id: string; data: Prisma.HotItemUpdateInput }> = []
    const snapshots: Prisma.HotItemSnapshotCreateManyInput[] = []
    const tagCounts = new Map<string, number>()

    for (const raw of rawItems) {
      try {
        const fingerprint = generateFingerprint(raw.title, raw.url)
        const legacyFingerprint = generateLegacyFingerprint(raw.title, raw.url)
        const existing = existingByFingerprint.get(fingerprint) ?? existingByFingerprint.get(legacyFingerprint)
        if (existing) {
          const collectedAt = new Date()
          const score = Math.max(existing.score, raw.score ?? 0)
          const rank = raw.rank ?? existing.rank
          const heat = Math.max(existing.heat + 1, raw.heat ?? 0)
          updates.push({ id: existing.id, data: { score, rank, heat, collectedAt } })
          snapshots.push({ hotItemId: existing.id, sourceId: source.id, crawlRunId: run.id, rank, heat, score, collectedAt })
          skippedItems++
          continue
        }
        const classification = classify({ title: raw.title, summary: raw.summary, url: raw.url, sourceName: source.name, defaultCategory: source.defaultCategory, defaultRegion: source.region })
        const tags = [...new Set([...classification.tags, ...(raw.tags ?? [])])]
        const collectedAt = new Date()
        newRows.push({ title: raw.title, url: raw.url, sourceId: source.id, sourceName: source.name, region: classification.region, category: classification.category, aiSubcategory: classification.aiSubcategory, language: classification.language, summary: raw.summary ?? null, rawContent: raw.rawContent ?? null, score: raw.score ?? 0, rank: raw.rank ?? null, heat: raw.heat ?? 1, fingerprint, tags: tags.join(','), publishedAt: raw.publishedAt ?? null, collectedAt, crawlRunId: run.id })
        for (const tag of tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      } catch (itemErr) { console.error(`Error processing "${raw.title}":`, itemErr) }
    }

    const createdItems = newRows.length > 0
      ? await prisma.hotItem.createManyAndReturn({ data: newRows, select: { id: true, rank: true, heat: true, score: true, collectedAt: true } })
      : []
    newItems = createdItems.length
    for (const item of createdItems) snapshots.push({ hotItemId: item.id, sourceId: source.id, crawlRunId: run.id, rank: item.rank, heat: item.heat, score: item.score, collectedAt: item.collectedAt })

    if (updates.length > 0) await prisma.$transaction(updates.map(update => prisma.hotItem.update({ where: { id: update.id }, data: update.data })))
    if (snapshots.length > 0) await prisma.hotItemSnapshot.createMany({ data: snapshots })
    if (tagCounts.size > 0) {
      await prisma.$transaction(Array.from(tagCounts.entries()).map(([tag, count]) => prisma.tag.upsert({ where: { name: tag }, update: { count: { increment: count } }, create: { name: tag, slug: tagSlug(tag), count } })))
    }

    const status = result.error ? 'partial' : 'success'
    const currentItemCount = await prisma.hotItem.count({ where: { sourceId } })
    await prisma.crawlRun.update({ where: { id: run.id }, data: { status, finishedAt: new Date(), itemCount: result.items.length, newItems, skippedItems, errorMessage: result.error ?? null } })
    await prisma.source.update({ where: { id: sourceId }, data: { lastStatus: status, lastSuccessAt: new Date(), lastError: result.error ?? null, itemCount: currentItemCount } })
    return { status, total: result.items.length, newItems, skipped: skippedItems, error: result.error }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.crawlRun.update({ where: { id: run.id }, data: { status: 'failed', finishedAt: new Date(), errorMessage: message } })
    await prisma.source.update({ where: { id: sourceId }, data: { lastStatus: 'failed', lastError: message } })
    return { status: 'failed' as const, total: 0, newItems: 0, skipped: 0, error: message }
  }
}

export async function crawlAllSources(limit?: number) {
  const sources = await prisma.source.findMany({
    where: { enabled: true },
    orderBy: { lastFetchedAt: { sort: 'asc', nulls: 'first' } },
    ...(limit ? { take: limit } : {}),
  })
  const results = []
  for (const source of sources) { console.log(`🕷 ${source.name}...`); const result = await runCrawlPipeline(source.id); console.log(`  ${result.status === 'success' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'} ${result.newItems} new`); results.push({ source: source.slug, ...result }) }
  return results
}
