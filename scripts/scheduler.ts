import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { runCrawlPipeline } from '../src/lib/crawl-pipeline'

const prisma = new PrismaClient()

async function crawlDueSources() {
  console.log(`\n🕷 [${new Date().toISOString()}] Checking...\n`)
  const sources = await prisma.source.findMany({ where: { enabled: true } })
  let crawled = 0
  for (const source of sources) {
    const now = Date.now()
    const lastFetch = source.lastFetchedAt ? new Date(source.lastFetchedAt).getTime() : 0
    if (now - lastFetch >= source.fetchIntervalMinutes * 60 * 1000) {
      console.log(`  Crawling: ${source.name}...`)
      const r = await runCrawlPipeline(source.id)
      console.log(`  ${r.status==='success'?'✅':r.status==='partial'?'⚠️':'❌'} ${r.newItems} new`)
      crawled++
    }
  }
  if (crawled === 0) console.log('  No sources due.')
}

async function main() {
  console.log('🕷 Scheduler started. Press Ctrl+C to stop.\n')
  await crawlDueSources()
  cron.schedule('* * * * *', () => crawlDueSources().catch(e => console.error('Scheduler error:', e)))
}
main().catch(console.error)
