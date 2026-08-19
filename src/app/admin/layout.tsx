import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { verifyToken } from '@/lib/auth'
import { getAdminStats } from '@/lib/services/adminService'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildfolio_token')?.value
  let user: { name: string; email: string } | null = null
  if (token) {
    try {
      const payload = verifyToken(token)
      user = { name: payload.name, email: payload.email }
    } catch {
      user = null
    }
  }

  let counts: { users: number; projects: number; comments: number } | null =
    null
  try {
    const stats = await getAdminStats()
    counts = {
      users: stats.stats.users,
      projects: stats.stats.projects,
      comments: stats.stats.comments,
    }
  } catch {
    counts = null
  }

  return (
    <div className='flex min-h-screen bg-bgMain text-dark'>
      <AdminSidebar user={user} counts={counts} />
      <main className='flex-1 md:ml-64 px-4 md:px-8 py-6 md:py-10 mt-14 md:mt-0 w-full'>
        {children}
      </main>
    </div>
  )
}

export default AdminLayout
