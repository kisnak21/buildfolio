import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex min-h-screen bg-bgMain text-dark'>
      <AdminSidebar />
      <main className='flex-1 md:ml-64 px-4 md:px-8 py-6 md:py-10 mt-14 md:mt-0 w-full'>
        {children}
      </main>
    </div>
  )
}

export default AdminLayout