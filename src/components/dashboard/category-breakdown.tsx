import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BreakdownItem { category?: string; subcategory?: string; region?: string; count: number }

const categoryColors: Record<string, string> = {
  ai: 'bg-purple-500',
  tech: 'bg-blue-500',
  finance: 'bg-yellow-500',
  business: 'bg-indigo-500',
  society: 'bg-green-500',
  entertainment: 'bg-pink-500',
  sports: 'bg-orange-500',
  politics: 'bg-red-500',
  research: 'bg-teal-500',
  other: 'bg-gray-500',
  china: 'bg-red-500',
  global: 'bg-blue-500',
  model: 'bg-purple-500',
  product: 'bg-blue-500',
  company: 'bg-indigo-500',
  funding: 'bg-yellow-500',
  policy: 'bg-red-500',
  open_source: 'bg-green-500',
  infra: 'bg-orange-500',
  application: 'bg-pink-500',
}

const categoryLabels: Record<string, string> = { ai:'AI', tech:'科技', finance:'财经', business:'商业', society:'社会', entertainment:'娱乐', sports:'体育', politics:'政治', research:'研究', other:'其他', china:'国内', global:'国际', model:'大模型', product:'AI产品', company:'AI公司', funding:'投融资', policy:'政策监管', open_source:'开源', infra:'基础设施', application:'应用落地' }

export function CategoryBreakdown({ data, title }: { data: BreakdownItem[]; title: string }) {
  const total = data.reduce((s, i) => s + i.count, 0)
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {data.map((item) => {
            const key = item.category ?? item.region ?? item.subcategory ?? 'other'
            const label = categoryLabels[key] ?? key
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            const color = categoryColors[key] ?? 'bg-gray-400'
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-16 text-xs text-muted-foreground truncate">{label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{item.count}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
