'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Globe, Flag, Cpu, BarChart3, Radio, ListChecks, Settings } from 'lucide-react'

const navigation = [
  { name: '实时总览', href: '/', icon: LayoutDashboard },
  { name: '国内热点', href: '/china', icon: Flag },
  { name: '国际热点', href: '/global', icon: Globe },
  { name: 'AI 热点', href: '/ai', icon: Cpu },
  { name: '趋势分析', href: '/analytics', icon: BarChart3 },
  { name: '数据源管理', href: '/sources', icon: Radio },
  { name: '采集日志', href: '/crawl-log', icon: ListChecks },
  { name: '系统设置', href: '/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  return (
    <aside className={cn('flex w-56 flex-col border-r bg-sidebar', className)}>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Cpu className="h-5 w-5 text-primary" />
        <div><span className="text-sm font-bold">热点聚合</span><p className="text-[10px] text-muted-foreground leading-none">Global Hot Topics</p></div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <a href={item.href} onClick={onNavigate} className={cn('flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50')}>
                  <item.icon className="h-4 w-4 shrink-0" />{item.name}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
          采集运行中
        </div>
      </div>
    </aside>
  )
}
