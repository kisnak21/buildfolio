'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getAdminFlags,
  updateAdminFlag,
  type AdminFlag,
} from '@/lib/api/adminApi'
import { buttonClass } from '@/components/ui/buttonClass'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  broken: 'Broken content',
  copyright: 'Copyright',
  other: 'Other',
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

const REASON_BADGE: Record<string, string> = {
  spam: 'bg-dangerSoft',
  inappropriate: 'bg-warningSoft',
  broken: 'bg-accentSoft',
  copyright: 'bg-orangeSoft',
  other: 'bg-gray-200',
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const formatTimestamp = (iso: string) => {
  const date = new Date(iso)
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${day}, ${time}`
}

const FlagsClient = () => {
  const dispatch = useAppDispatch()
  const [rows, setRows] = useState<AdminFlag[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAdminFlags({ status: status || undefined, page, limit: 50 })
      .then((data) => {
        if (cancelled) return
        setRows(data.data)
        setPagination(data.pagination)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load flags',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [status, page])

  const updateStatus = async (flag: AdminFlag, next: 'resolved' | 'dismissed') => {
    setBusyId(flag.id)
    try {
      await updateAdminFlag(flag.id, next)
      dispatch(
        showToast({
          message: `Flag ${next === 'resolved' ? 'resolved' : 'dismissed'}`,
          type: 'success',
        }),
      )
      setRows((prev) =>
        prev.map((f) =>
          f.id === flag.id ? { ...f, status: next } : f,
        ),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Update failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
    }
  }

  const switchTab = (value: string) => {
    setStatus(value)
    setPage(1)
  }

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6'>
        <div>
          <h1 className='text-3xl font-black'>Content Flags</h1>
          <p className='text-sm font-bold text-gray-600'>
            User reports on projects and comments
          </p>
        </div>
      </div>

      <div className='flex flex-wrap gap-2 mb-4'>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => switchTab(tab.value)}
            className={`px-4 py-1.5 rounded-lg border-2 border-dark font-black text-sm transition-all ${
              status === tab.value
                ? 'bg-secondary shadow-brutal-sm'
                : 'bg-white hover:bg-inputBg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p className='mb-4 text-sm font-bold text-red-600'>{error}</p>
      )}

      {loading ? (
        <p className='text-sm font-bold text-gray-500'>Loading…</p>
      ) : rows.length === 0 ? (
        <p className='text-sm font-bold text-gray-500'>No flags found</p>
      ) : (
        <div className='bg-white border-4 border-dark rounded-2xl overflow-hidden shadow-brutal'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='bg-inputBg border-b-4 border-dark font-black'>
                  <th className='px-4 py-3'>Target</th>
                  <th className='px-4 py-3'>Reason</th>
                  <th className='px-4 py-3'>Details</th>
                  <th className='px-4 py-3'>Reporter</th>
                  <th className='px-4 py-3'>Reported</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((flag) => (
                  <tr
                    key={flag.id}
                    className='border-b-2 border-dark/10 align-top'
                  >
                    <td className='px-4 py-3'>
                      <div className='font-black'>
                        {flag.targetType === 'project'
                          ? 'Project'
                          : 'Comment'}
                      </div>
                      {flag.targetName ? (
                        <div className='text-xs font-bold text-gray-600 max-w-[180px] truncate'>
                          {flag.targetName}
                        </div>
                      ) : (
                        <div className='text-xs font-bold text-red-500'>
                          Target deleted
                        </div>
                      )}
                      <div className='text-xs text-gray-400 font-mono'>
                        {flag.targetId.slice(0, 8)}
                      </div>
                      {flag.targetType === 'project' && flag.targetName && (
                        <Link
                          href={`/projects/${flag.targetId}`}
                          className='text-xs font-black text-accent hover:underline'
                        >
                          View
                        </Link>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-block text-xs font-black px-2 py-0.5 rounded border-2 border-dark ${REASON_BADGE[flag.reason] ?? 'bg-gray-200'}`}
                      >
                        {REASON_LABELS[flag.reason] ?? flag.reason}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-xs font-bold text-gray-600 max-w-[220px]'>
                      {flag.details || '—'}
                    </td>
                    <td className='px-4 py-3 text-xs font-bold'>
                      {flag.reporterName || 'Unknown'}
                    </td>
                    <td className='px-4 py-3 text-xs font-bold text-gray-600 whitespace-nowrap'>
                      {formatTimestamp(flag.createdAt)}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-block text-xs font-black px-2 py-0.5 rounded border-2 border-dark ${
                          flag.status === 'pending'
                            ? 'bg-warningSoft'
                            : flag.status === 'resolved'
                              ? 'bg-successSoft'
                              : 'bg-gray-200'
                        }`}
                      >
                        {flag.status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      {flag.status === 'pending' ? (
                        <div className='flex gap-2'>
                          <button
                            onClick={() => updateStatus(flag, 'resolved')}
                            disabled={busyId === flag.id}
                            className={`${buttonClass('primary', 'sm')} disabled:opacity-50`}
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => updateStatus(flag, 'dismissed')}
                            disabled={busyId === flag.id}
                            className={`${buttonClass('danger', 'sm')} disabled:opacity-50`}
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className='text-xs font-bold text-gray-400'>
                          {flag.resolvedAt
                            ? formatTimestamp(flag.resolvedAt)
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className='flex items-center justify-between px-4 py-3 border-t-4 border-dark'>
              <span className='text-xs font-bold text-gray-600'>
                Page {pagination.page} of {pagination.totalPages} ·{' '}
                {pagination.total} total
              </span>
              <div className='flex gap-2'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`${buttonClass('secondary', 'sm')} disabled:opacity-40`}
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className={`${buttonClass('secondary', 'sm')} disabled:opacity-40`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FlagsClient