import { after, NextResponse } from 'next/server'
import { crawlAllSources } from '@/lib/crawl-pipeline'

export const dynamic = 'force-dynamic'

const DEFAULT_CRON_SOURCE_LIMIT = 6
const MAX_CRON_SOURCE_LIMIT = 8

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

function getSourceLimit(request: Request) {
  const url = new URL(request.url)
  const rawLimit = Number(url.searchParams.get('limit') ?? DEFAULT_CRON_SOURCE_LIMIT)

  if (!Number.isFinite(rawLimit) || rawLimit <= 0) {
    return DEFAULT_CRON_SOURCE_LIMIT
  }

  return Math.min(Math.floor(rawLimit), MAX_CRON_SOURCE_LIMIT)
}

function shouldRunSynchronously(request: Request) {
  const url = new URL(request.url)
  return url.searchParams.get('sync') === '1'
}

async function handleCrawlRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const limit = getSourceLimit(request)

  if (!shouldRunSynchronously(request)) {
    after(async () => {
      try {
        await crawlAllSources(limit)
      } catch (err) {
        console.error('Background crawl failed:', err)
      }
    })

    return NextResponse.json({
      ok: true,
      accepted: true,
      timestamp: new Date().toISOString(),
      limit,
    })
  }

  try {
    const results = await crawlAllSources(limit)
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), limit, results })
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
