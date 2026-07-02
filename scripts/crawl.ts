import { PrismaClient } from '@prisma/client'
import { runCrawlPipeline, crawlAllSources } from '../src/lib/crawl-pipeline'

const prisma = new PrismaClient()

async function main() {
  const arg = process.argv[2]
  if (arg) {
    const source = await prisma.source.findUnique({ where: { slug: arg } })
    if (!source) { console.error(`❌ Source not found: ${arg}`); process.exit(1) }
    console.log(`🕷 Crawling: ${source.name}\n`)
    const r = await runCrawlPipeline(source.id)
    console.log(`\n${r.status==='success'?'✅':r.status==='partial'?'⚠️':'❌'} ${r.status}: ${r.newItems} new, ${r.skipped} skipped${r.error?` (${r.error})`:''}`)
  } else {
    console.log('🕷 Crawling all enabled sources...\n')
    const results = await crawlAllSources()
    const ok = results.filter(r=>r.status==='success').length
    const part = results.filter(r=>r.status==='partial').length
    const fail = results.filter(r=>r.status==='failed').length
    console.log(`\n📊 ${ok} success, ${part} partial, ${fail} failed`)
  }
}
main().catch(console.error).finally(()=>prisma.$disconnect())
