'use client'

import { LogOut, Menu, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface HeaderProps { onMenuClick?: () => void; lastUpdated?: Date | null }

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
      <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}><Menu className="h-5 w-5" /></Button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
        实时
      </div>
      <Button variant="ghost" size="icon" title="刷新数据" aria-label="刷新数据" onClick={() => router.refresh()}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      <a href="/api/auth/logout" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="h-3.5 w-3.5" />退出</a>
    </header>
  )
}
