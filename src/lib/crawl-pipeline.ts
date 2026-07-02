import { prisma } from '@/lib/prisma'
import { getCrawler } from '@/lib/crawlers'
import { classify, generateFingerprint } from '@/lib/classifier'

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

    for (const raw of result.items) {
      try {
        const fingerprint = generateFingerprint(raw.title, raw.url)
        const existing = await prisma.hotItem.findUnique({ where: { fingerprint } })
        if (existing) {
          await prisma.hotItem.update({ where: { id: existing.id }, data: { score: Math.max(existing.score, raw.score ?? 0), heat: existing.heat + 1, collectedAt: new Date() } })
          skippedItems++; continue
        }
        const classification = classify({ title: raw.title, summary: raw.summary, url: raw.url, sourceName: source.name, defaultCategory: source.defaultCategory, defaultRegion: source.region })
        await prisma.hotItem.create({ data: { title: raw.title, url: raw.url, sourceId: source.id, sourceName: source.name, region: classification.region, category: classification.category, aiSubcategory: classification.aiSubcategory, language: classification.language, summary: raw.summary ?? null, rawContent: raw.rawContent ?? null, score: raw.score ?? 0, rank: raw.rank ?? null, heat: raw.heat ?? 1, fingerprint, tags: classification.tags.join(','), publishedAt: raw.publishedAt ?? null, collectedAt: new Date(), crawlRunId: run.id } })
        for (const tag of classification.tags) { await prisma.tag.upsert({ where: { name: tag }, update: { count: { increment: 1 } }, create: { name: tag, slug: tag.toLowerCase().replace(/\s+/g,'-'), count: 1 } }) }
        newItems++
      } catch (itemErr) { console.error(`Error processing "${raw.title}":`, itemErr) }
    }

    const status = result.error ? 'partial' : 'success'
    await prisma.crawlRun.update({ where: { id: run.id }, data: { status, finishedAt: new Date(), itemCount: result.items.length, newItems, skippedItems, errorMessage: result.error ?? null } })
    await prisma.source.update({ where: { id: sourceId }, data: { lastStatus: status, lastSuccessAt: new Date(), lastError: result.error ?? null, itemCount: { increment: newItems } } })
    return { status, total: result.items.length, newItems, skipped: skippedItems, error: result.error }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.crawlRun.update({ where: { id: run.id }, data: { status: 'failed', finishedAt: new Date(), errorMessage: message } })
    await prisma.source.update({ where: { id: sourceId }, data: { lastStatus: 'failed', lastError: message } })
    return { status: 'failed' as const, total: 0, newItems: 0, skipped: 0, error: message }
  }
}

export async function crawlAllSources() {
  const sources = await prisma.source.findMany({ where: { enabled: true }, orderBy: { lastFetchedAt: { sort: 'asc', nulls: 'first' } } })
  const results = []
  for (const source of sources) { console.log(`🕷 ${source.name}...`); const result = await runCrawlPipeline(source.id); console.log(`  ${result.status === 'success' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'} ${result.newItems} new`); results.push({ source: source.slug, ...result }) }
  return results
}
