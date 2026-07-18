import { after, NextResponse } from 'next/server'
import { crawlAllSources } from '@/lib/crawl-pipeline'
import { prisma } from '@/lib/prisma'

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

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 1_000)
}

async function completeInvocation(invocationId: string, limit: number) {
  await prisma.cronInvocation.update({
    where: { id: invocationId },
    data: { status: 'running', startedAt: new Date() },
  })

  try {
    const results = await crawlAllSources(limit)
    const failed = results.filter(result => result.status === 'failed')
    const partial = results.filter(result => result.status === 'partial')
    const error = [...failed, ...partial]
      .map(result => result.error ? `${result.source}: ${result.error}` : result.source)
      .join('\n')

    await prisma.cronInvocation.update({
      where: { id: invocationId },
      data: {
        status: failed.length > 0 ? 'failed' : partial.length > 0 ? 'partial' : 'success',
        sourceCount: results.length,
        newItems: results.reduce((total, result) => total + result.newItems, 0),
        skippedItems: results.reduce((total, result) => total + result.skipped, 0),
        errorMessage: error || null,
        finishedAt: new Date(),
      },
    })

    return results
  } catch (error) {
    const message = errorMessage(error)
    await prisma.cronInvocation.update({
      where: { id: invocationId },
      data: { status: 'failed', errorMessage: message, finishedAt: new Date() },
    }).catch(updateError => console.error('Failed to record cron failure:', updateError))
    throw error
  }
}

async function handleCrawlRequest(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const limit = getSourceLimit(request)
    const mode = shouldRunSynchronously(request) ? 'synchronous' : 'background'
    const invocation = await prisma.cronInvocation.create({ data: { sourceLimit: limit, mode } })

    if (mode === 'background') {
      try {
        after(async () => {
          try {
            await completeInvocation(invocation.id, limit)
          } catch (error) {
            console.error('Background crawl failed:', error)
          }
        })
      } catch (error) {
        const message = errorMessage(error)
        await prisma.cronInvocation.update({
          where: { id: invocation.id },
          data: { status: 'failed', errorMessage: message, finishedAt: new Date() },
        }).catch(updateError => console.error('Failed to record cron registration failure:', updateError))
        throw error
      }

      return NextResponse.json({
        ok: true,
        accepted: true,
        timestamp: new Date().toISOString(),
        limit,
        invocationId: invocation.id,
      })
    }

    const results = await completeInvocation(invocation.id, limit)
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), limit, results, invocationId: invocation.id })
  } catch (error) {
    console.error('Cron request failed:', error)
    return NextResponse.json({ ok: false, error: 'Unable to schedule crawl' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleCrawlRequest(request)
}

export async function POST(request: Request) {
  return handleCrawlRequest(request)
}
