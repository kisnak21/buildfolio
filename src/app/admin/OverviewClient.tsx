'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  getAdminStats,
  type AdminStats,
} from '@/lib/api/adminApi'

const formatRelativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatDay = (iso: string, index: number, total: number) => {
  if (index === total - 1) return 'Today'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const isRecent = (iso: string) =>
  Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000

const OverviewClient = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [health, setHealth] = useState<'checking' | 'ok' | 'down'>('checking')

  const load = async () => {
    try {
      setStats(await getAdminStats())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => {
        if (!cancelled) setHealth(res.ok ? 'ok' : 'down')
      })
      .catch(() => {
        if (!cancelled) setHealth('down')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const chartMax = useMemo(() => {
    if (!stats) return 1
    return Math.max(...stats.chart.map((c) => c.count), 1)
  }, [stats])

  const statCards = stats
    ? [
        {
          label: 'Users',
          value: stats.stats.users,
          sub: `+${stats.week.users} this week`,
          className: 'bg-primary',
          subClass: 'text-gray-700',
        },
        {
          label: 'Projects',
          value: stats.stats.projects,
          sub: `+${stats.week.projects} this week`,
          className: 'bg-accentSoft',
          subClass: 'text-gray-700',
        },
        {
          label: 'Comments',
          value: stats.stats.comments,
          sub: `+${stats.week.comments} this week`,
          className: 'bg-successSoft',
          subClass: 'text-gray-700',
        },
        {
          label: 'Likes',
          value: stats.stats.likes.toLocaleString('en-US'),
          sub: `+${stats.week.likes.toLocaleString('en-US')} this week`,
          className: 'bg-purpleSoft',
          labelClass: 'text-white',
          valueClass: 'text-white',
          subClass: 'text-white/80',
        },
        {
          label: 'Bookmarks',
          value: stats.stats.bookmarks,
          sub: `+${stats.week.bookmarks} this week`,
          className: 'bg-white',
          subClass: 'text-gray-600',
        },
      ]
    : []

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Overview</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Platform health at a glance.
          </p>
        </div>
        <span
          className={`font-bold border-2 border-dark px-3 py-1.5 rounded-lg shadow-brutal-sm text-sm flex items-center gap-2 w-fit ${
            health === 'ok'
              ? 'bg-successSoft'
              : health === 'down'
                ? 'bg-dangerSoft'
                : 'bg-white'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 border-2 border-dark rounded-full ${
              health === 'ok'
                ? 'bg-greenMid'
                : health === 'down'
                  ? 'bg-red-600 animate-pulse'
                  : 'bg-gray-400'
            }`}
          />
          {health === 'checking'
            ? 'Checking systems...'
            : health === 'ok'
              ? 'All systems operational'
              : 'System degraded'}
        </span>
      </div>

      {loading && (
        <div className='grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-10'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='bg-white border-4 border-dark rounded-2xl p-5 shadow-brutal animate-pulse'
            >
              <div className='h-4 w-16 bg-gray-200 rounded mb-3' />
              <div className='h-8 w-20 bg-gray-200 rounded' />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <p className='font-bold text-sm'>{error}</p>
          <button
            onClick={() => {
              setError('')
              setLoading(true)
              void load()
            }}
            className={`${buttonClass('primary', 'sm', '')} shrink-0`}
          >
            Retry
          </button>
        </div>
      )}

      {stats && (
        <>
          <div className='grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-10'>
            {statCards.map((card) => (
              <AdminStatCard key={card.label} {...card} />
            ))}
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-black'>
                  New signups — last 14 days
                </h2>
                <span className='btn-brutal bg-primary border-2 border-dark px-3 py-1 rounded-lg text-xs font-bold shadow-brutal-sm'>
                  14d
                </span>
              </div>
              <div className='flex items-end gap-1 sm:gap-2 h-44'>
                {stats.chart.map((bar, i) => (
                  <div
                    key={bar.date}
                    className={`bar flex-1 border-2 border-dark rounded-t-md transition-all ${
                      i === stats.chart.length - 1
                        ? 'bg-secondary'
                        : i % 7 === 0
                          ? 'bg-primary'
                          : 'bg-accentSoft'
                    }`}
                    style={{ height: `${Math.max((bar.count / chartMax) * 100, 3)}%` }}
                    title={`${formatDay(bar.date, i, stats.chart.length)}: ${bar.count} signups`}
                  />
                ))}
              </div>
              <div className='flex gap-1 sm:gap-2 mt-2'>
                {stats.chart.map((bar, i) => (
                  <span
                    key={bar.date}
                    className='flex-1 text-center text-[9px] sm:text-[10px] font-bold text-gray-400 truncate'
                  >
                    {formatDay(bar.date, i, stats.chart.length)}
                  </span>
                ))}
              </div>
            </div>

            <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
              <h2 className='text-xl font-black mb-4'>Recent signups</h2>
              <div className='space-y-4'>
                {stats.recentSignups.length === 0 && (
                  <p className='text-sm font-bold text-gray-500'>
                    No signups yet
                  </p>
                )}
                {stats.recentSignups.map((signup) => (
                  <div key={signup.id} className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-full border-2 border-dark bg-successSoft overflow-hidden shrink-0'>
                      <Image
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${signup.username}`}
                        alt={signup.name}
                        width={36}
                        height={36}
                        unoptimized
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='leading-tight min-w-0'>
                      <p className='font-black text-sm truncate'>
                        {signup.name}
                      </p>
                      <p className='text-xs font-bold text-gray-500 truncate'>
                        @{signup.username} ·{' '}
                        {formatRelativeTime(signup.createdAt)}
                      </p>
                    </div>
                    {isRecent(signup.createdAt) && (
                      <span className='ml-auto text-xs font-black bg-warningSoft border-2 border-dark px-2 py-0.5 rounded shadow-brutal-sm'>
                        NEW
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Link
                href='/admin/users'
                className={`${buttonClass('secondary', 'md', 'w-full mt-5')}`}
              >
                View all users
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OverviewClient