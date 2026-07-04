import { NextResponse } from 'next/server'
import { crawlAllSources } from '@/lib/crawl-pipeline'

export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return true
  }

  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')
  const authHeader = request.headers.get('authorization')

  return querySecret === cronSecret || authHeader === `Bearer ${cronSecret}`
}

async function handleCrawlRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await crawlAllSources()
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), results })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleCrawlRequest(request)
}

export async function POST(request: Request) {
  return handleCrawlRequest(request)
}
