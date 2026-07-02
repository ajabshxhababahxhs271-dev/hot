import { NextResponse } from 'next/server'
import { crawlAllSources } from '@/lib/crawl-pipeline'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const results = await crawlAllSources()
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), results })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function POST() { return GET() }
