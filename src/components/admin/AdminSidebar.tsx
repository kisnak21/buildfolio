'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ChartBarIcon,
  UsersIcon,
  CodeBracketIcon,
  ChatBubbleOvalLeftIcon,
  TagIcon,
  ClockIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { useAppDispatch } from '@/store/redux/hooks'
import { logoutUser } from '@/store/redux/authSlice'
import { showToast } from '@/store/redux/toastSlice'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  badgeClass?: string
}

interface AdminSidebarProps {
  user: { name: string; email: string } | null
  counts: { users: number; projects: number; comments: number } | null
}

const NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { href: '/admin', label: 'Overview', icon: ChartBarIcon },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/projects', label: 'Projects', icon: CodeBracketIcon },
  { href: '/admin/comments', label: 'Comments', icon: ChatBubbleOvalLeftIcon },
  { href: '/admin/categories', label: 'Categories & Tech', icon: TagIcon },
]

const BADGE_CLASS: Record<string, string> = {
  '/admin/users': 'bg-accentSoft',
  '/admin/projects': 'bg-successSoft',
  '/admin/comments': 'bg-warningSoft',
}

const AdminSidebar = ({ user, counts }: AdminSidebarProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const navClass = (href: string) =>
    `nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dark font-bold text-left transition-all ${
      isActive(href) ? 'bg-secondary shadow-brutal' : 'bg-white hover:bg-inputBg'
    }`

  const closeSidebar = () => setOpen(false)

  const handleLogout = () => {
    dispatch(logoutUser())
    dispatch(
      showToast({ message: 'You have been logged out', type: 'success' }),
    )
    router.push('/')
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r-4 border-dark flex flex-col transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className='p-5 border-b-4 border-dark flex items-center gap-2'>
          <div className='w-7 h-7 bg-secondary border-2 border-dark rounded-md shadow-brutal-sm' />
          <span className='text-lg font-black tracking-tight'>buildfolio</span>
          <span className='ml-auto text-[10px] font-black bg-primary border-2 border-dark px-1.5 py-0.5 rounded shadow-brutal-sm uppercase'>
            Admin
          </span>
        </div>

        <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
          {NAV_ITEMS.map((item) => {
            const key = item.href.replace('/admin/', '') as
              | 'users'
              | 'projects'
              | 'comments'
            const badge = counts?.[key]
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={navClass(item.href)}
              >
                <item.icon className='w-5 h-5' />
                {item.label}
                {typeof badge === 'number' && (
                  <span
                    className={`ml-auto text-xs font-black ${BADGE_CLASS[item.href] ?? 'bg-gray-200'} border-2 border-dark px-2 py-0.5 rounded shadow-brutal-sm`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}

          <button
            disabled
            className='w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dark font-bold text-left bg-gray-100 opacity-50 cursor-not-allowed mt-6'
          >
            <ClockIcon className='w-5 h-5' />
            Audit Logs
            <span className='ml-auto text-[10px] font-black bg-gray-200 border-2 border-dark px-1.5 py-0.5 rounded'>
              SOON
            </span>
          </button>
        </nav>

        <div className='p-4 border-t-4 border-dark'>
          <button
            onClick={handleLogout}
            className='w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dark font-bold bg-white hover:bg-inputBg transition-colors'
          >
            <div className='w-8 h-8 rounded-full border-2 border-dark bg-purpleSoft overflow-hidden shrink-0'>
              <Image
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${user?.email ?? 'admin'}`}
                alt={user?.name ?? 'Admin'}
                width={32}
                height={32}
                unoptimized
                className='w-full h-full object-cover'
              />
            </div>
            <div className='leading-tight text-left min-w-0'>
              <p className='font-black text-sm truncate'>
                {user?.name ?? 'Admin'}
              </p>
              <p className='text-xs font-bold text-gray-500 truncate'>
                {user?.email ?? 'Logged in via cookie'}
              </p>
            </div>
            <ArrowRightStartOnRectangleIcon className='w-4 h-4 ml-auto text-gray-500 shrink-0' />
          </button>
        </div>
      </aside>

      <div className='md:hidden fixed top-0 inset-x-0 z-50 bg-white border-b-4 border-dark px-4 py-3 flex items-center gap-3'>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className='btn-brutal p-2 border-2 border-dark rounded-lg shadow-brutal-sm bg-white'
          aria-label='Toggle menu'
        >
          <Bars3Icon className='w-5 h-5' />
        </button>
        <span className='font-black'>
          buildfolio{' '}
          <span className='text-xs bg-primary border-2 border-dark px-1.5 py-0.5 rounded shadow-brutal-sm uppercase ml-1'>
            Admin
          </span>
        </span>
      </div>

      {open && (
        <div
          className='fixed inset-0 z-30 bg-dark/40 md:hidden'
          onClick={closeSidebar}
        />
      )}
    </>
  )
}

export default AdminSidebar