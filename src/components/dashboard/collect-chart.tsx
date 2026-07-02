'use client'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HourData { hour: string; count: number }

export function CollectChart({ data }: { data: HourData[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">过去24小时采集量</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} className="text-[10px] text-muted-foreground" interval={3} />
            <YAxis tickLine={false} axisLine={false} className="text-[10px] text-muted-foreground" width={30} />
            <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', fontSize: '0.75rem' }} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
