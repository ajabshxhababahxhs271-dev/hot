'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const refresh = () => router.refresh()
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar className="fixed inset-y-0 left-0 z-30 hidden lg:flex" />
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-56 p-0 [&>button]:hidden">
          <Sidebar className="h-full" onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-56">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="min-h-[calc(100vh-3.5rem)] p-4 md:p-6 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
