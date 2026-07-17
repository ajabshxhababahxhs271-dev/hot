import { LockKeyhole } from 'lucide-react'

export const dynamic = 'force-dynamic'

function messageForError(error: string | undefined) {
  if (error === 'config') return '登录保护尚未配置，请在部署环境中设置 AUTH_SECRET、ADMIN_USERNAME 和 ADMIN_PASSWORD。'
  if (error === 'invalid') return '用户名或密码不正确。'
  return ''
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams
  const errorMessage = messageForError(params.error)
  const next = params.next?.startsWith('/') && !params.next.startsWith('//') ? params.next : '/'

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></div>
          <h1 className="text-xl font-semibold">热点聚合登录</h1>
          <p className="mt-1 text-sm text-muted-foreground">请输入管理员账号继续</p>
        </div>
        {errorMessage && <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>}
        <form action="/api/auth/login" method="post" className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block space-y-1.5 text-sm font-medium">用户名<input name="username" required autoComplete="username" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" /></label>
          <label className="block space-y-1.5 text-sm font-medium">密码<input name="password" type="password" required autoComplete="current-password" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" /></label>
          <button type="submit" className="h-9 w-full rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80">登录</button>
        </form>
      </div>
    </main>
  )
}
