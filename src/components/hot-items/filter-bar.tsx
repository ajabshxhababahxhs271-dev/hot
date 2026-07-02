'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCallback } from 'react'

interface FilterBarProps {
  showRegion?: boolean; showAiSub?: boolean
  defaultRegion?: string; defaultCategory?: string; defaultAiSub?: string
}

const REGIONS = [{ value: 'all', label: '全部地区' },{ value: 'china', label: '国内' },{ value: 'global', label: '国际' }]
const CATEGORIES = [{ value: 'all', label: '全部分类' },{ value: 'ai', label: 'AI' },{ value: 'tech', label: '科技' },{ value: 'finance', label: '财经' },{ value: 'business', label: '商业' },{ value: 'society', label: '社会' },{ value: 'entertainment', label: '娱乐' },{ value: 'sports', label: '体育' },{ value: 'politics', label: '政治' },{ value: 'research', label: '研究' },{ value: 'other', label: '其他' }]
const AI_SUBS = [{ value: 'all', label: '全部AI子类' },{ value: 'model', label: '大模型' },{ value: 'product', label: 'AI产品' },{ value: 'company', label: 'AI公司' },{ value: 'research', label: '论文研究' },{ value: 'funding', label: '投融资' },{ value: 'policy', label: '政策监管' },{ value: 'open_source', label: '开源' },{ value: 'infra', label: '基础设施' },{ value: 'application', label: '应用落地' },{ value: 'other', label: '其他AI' }]
const SORTS = [{ value: 'collectedAt', label: '最新采集' },{ value: 'heat', label: '热度最高' },{ value: 'score', label: '评分最高' },{ value: 'publishedAt', label: '发布时间' }]

export function FilterBar({ showRegion = true, showAiSub = false, defaultRegion, defaultCategory, defaultAiSub }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const region = (searchParams.get('region') ?? defaultRegion ?? 'all') as string
  const category = (searchParams.get('category') ?? defaultCategory ?? 'all') as string
  const aiSub = (searchParams.get('aiSub') ?? defaultAiSub ?? 'all') as string
  const sort = (searchParams.get('sort') ?? 'collectedAt') as string
  const search = (searchParams.get('search') ?? '') as string

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === 'all' || value === '') params.delete(key); else params.set(key, value)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [router, pathname, searchParams])

  const updateParam = (key: string) => (value: string | null) => {
    if (value === null) return
    updateParams({ [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索..." defaultValue={search} className="pl-8 pr-8" onKeyDown={(e) => { if (e.key === 'Enter') updateParams({ search: (e.target as HTMLInputElement).value }) }} />
        {search && <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => updateParams({ search: '' })}><X className="h-3 w-3" /></Button>}
      </div>
      {showRegion && <Select value={region} onValueChange={updateParam('region')}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select>}
      <Select value={category} onValueChange={updateParam('category')}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select>
      {showAiSub && <Select value={aiSub} onValueChange={updateParam('aiSub')}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{AI_SUBS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>}
      <Select value={sort} onValueChange={updateParam('sort')}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{SORTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
    </div>
  )
}
