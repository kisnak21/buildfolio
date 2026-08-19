'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  getAdminAuditLogs,
  type AdminAuditLog,
} from '@/lib/api/adminApi'
import { buttonClass } from '@/components/ui/buttonClass'

const EXPORT_LIMIT = 5000

const ACTION_GROUPS: { label: string; actions: string[] }[] = [
  {
    label: 'User',
    actions: ['user.promote', 'user.demote', 'user.verify', 'user.delete'],
  },
  { label: 'Content', actions: ['project.delete', 'comment.delete'] },
  {
    label: 'Category & Tech',
    actions: [
      'category.create',
      'category.rename',
      'category.delete',
      'tech.create',
      'tech.delete',
    ],
  },
  {
    label: 'Auth',
    actions: ['auth.login_fail', 'auth.register', 'auth.password_reset'],
  },
  {
    label: 'Flags',
    actions: ['flag.create', 'flag.resolve', 'flag.dismiss'],
  },
]

const ACTION_BADGE_CLASS: Record<string, string> = {
  'user.promote': 'bg-warningSoft',
  'user.demote': 'bg-warningSoft',
  'user.verify': 'bg-successSoft',
  'user.delete': 'bg-dangerSoft',
  'project.delete': 'bg-dangerSoft',
  'comment.delete': 'bg-dangerSoft',
  'category.create': 'bg-accentSoft',
  'category.rename': 'bg-accentSoft',
  'category.delete': 'bg-dangerSoft',
  'tech.create': 'bg-accentSoft',
  'tech.delete': 'bg-dangerSoft',
  'auth.login_fail': 'bg-dangerSoft',
  'auth.register': 'bg-orangeSoft',
  'auth.password_reset': 'bg-warningSoft',
  'flag.create': 'bg-warningSoft',
  'flag.resolve': 'bg-successSoft',
  'flag.dismiss': 'bg-gray-200',
}

const actionBadgeClass = (action: string) =>
  ACTION_BADGE_CLASS[action] ?? 'bg-gray-200'

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

const formatDetails = (log: AdminAuditLog) => {
  if (!log.metadata) return '—'
  const parts: string[] = []
  for (const [key, value] of Object.entries(log.metadata)) {
    parts.push(`${key}: ${JSON.stringify(value)}`)
  }
  return parts.length > 0 ? parts.join(', ') : '—'
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const AuditLogsClient = () => {
  const [rows, setRows] = useState<AdminAuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  useEffect(() => {
    let cancelled = false
    getAdminAuditLogs({
      page,
      limit: perPage,
      action: action || undefined,
      search: deferredSearch || undefined,
      from: from || undefined,
      to: to || undefined,
    })
      .then((data) => {
        if (cancelled) return
        setRows(data.data)
        setPagination(data.pagination)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load audit logs',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, perPage, action, deferredSearch, from, to])

  const resetPage = () => {
    setPage(1)
    setLoading(true)
    setError('')
  }

  const handleDownload = (format: 'csv' | 'json') => {
    void getAdminAuditLogs({
      limit: EXPORT_LIMIT,
      action: action || undefined,
      search: deferredSearch || undefined,
      from: from || undefined,
      to: to || undefined,
    }).then((data) => {
      const csvHeader = [
        'timestamp',
        'actor_name',
        'actor_email',
        'action',
        'target_type',
        'target_id',
        'target_name',
        'metadata',
        'ip',
      ].join(',')
      const csvRows = data.data.map((log) =>
        [
          log.createdAt,
          log.actorName ?? '',
          log.actorEmail ?? '',
          log.action,
          log.targetType,
          log.targetId ?? '',
          log.targetName ?? '',
          log.metadata ? JSON.stringify(log.metadata) : '',
          log.ip ?? '',
        ]
          .map((field) => `"${String(field).replaceAll('"', '""')}"`)
          .join(','),
      )
      const blob =
        format === 'csv'
          ? new Blob([csvHeader + '\n' + csvRows.join('\n')], {
              type: 'text/csv',
            })
          : new Blob([JSON.stringify(data.data, null, 2)], {
              type: 'application/json',
            })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    })
  }

  const totalPages = pagination?.totalPages ?? 1
  const pageNumbers: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (page > 3) pageNumbers.push('…')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pageNumbers.push(i)
    if (page < totalPages - 2) pageNumbers.push('…')
    pageNumbers.push(totalPages)
  }

  const fromCount = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
  const toCount = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Audit Logs</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Every admin & sensitive action, immutably recorded.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => handleDownload('csv')}
            className={`${buttonClass('secondary', 'md', '')} shrink-0`}
          >
            Export CSV
          </button>
          <button
            onClick={() => handleDownload('json')}
            className={`${buttonClass('primary', 'md', '')} shrink-0`}
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className='bg-white border-4 border-dark rounded-2xl p-4 shadow-brutal mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        <input
          type='text'
          placeholder='Search actor, target...'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            resetPage()
          }}
          className='w-full bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary'
        />
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            resetPage()
          }}
          className='bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary appearance-none cursor-pointer'
        >
          <option value=''>All Actions</option>
          {ACTION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <input
          type='date'
          value={from}
          max={to || undefined}
          onChange={(e) => {
            setFrom(e.target.value)
            resetPage()
          }}
          className='bg-white border-2 border-dark px-3 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary'
        />
        <input
          type='date'
          value={to}
          min={from || undefined}
          onChange={(e) => {
            setTo(e.target.value)
            resetPage()
          }}
          className='bg-white border-2 border-dark px-3 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary'
        />
      </div>

      <div className='flex flex-wrap items-center gap-2 mb-4 text-xs font-black'>
        <span className='bg-warningSoft border-2 border-dark px-2 py-0.5 rounded'>
          user / role
        </span>
        <span className='bg-successSoft border-2 border-dark px-2 py-0.5 rounded'>
          verify
        </span>
        <span className='bg-dangerSoft border-2 border-dark px-2 py-0.5 rounded'>
          delete / fail
        </span>
        <span className='bg-accentSoft border-2 border-dark px-2 py-0.5 rounded'>
          category / tech
        </span>
        <span className='bg-orangeSoft border-2 border-dark px-2 py-0.5 rounded'>
          auth
        </span>
      </div>

      {error && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <p className='font-bold text-sm'>{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              setError('')
              setPage(1)
            }}
            className={`${buttonClass('primary', 'sm', '')} shrink-0`}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
          <div className='bg-dark text-white px-4 py-3 font-black'>Loading…</div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-4 px-4 py-4 border-t-2 border-dark animate-pulse'
            >
              <div className='h-4 w-32 bg-gray-200 rounded' />
              <div className='h-4 w-24 bg-gray-200 rounded' />
              <div className='h-4 w-28 bg-gray-200 rounded' />
              <div className='h-4 w-40 bg-gray-200 rounded' />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className='bg-white border-4 border-dark rounded-2xl p-10 shadow-brutal text-center'>
          <p className='text-xl font-black mb-1'>No audit events found</p>
          <p className='font-medium text-gray-600'>
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <>
          <AuditLogTable
            rows={rows}
            actorSeed={(log) => log.actorEmail ?? log.actorName ?? 'system'}
            actionBadgeClass={actionBadgeClass}
            formatTimestamp={formatTimestamp}
            formatDetails={formatDetails}
          />
          <AuditLogPagination
            page={page}
            totalPages={totalPages}
            total={pagination?.total ?? 0}
            fromCount={fromCount}
            toCount={toCount}
            perPage={perPage}
            pageNumbers={pageNumbers}
            onPageChange={(next) => {
              setPage(next)
              setLoading(true)
            }}
            onPerPageChange={(size) => {
              setPerPage(size)
              setPage(1)
              setLoading(true)
            }}
          />
        </>
      )}
    </div>
  )
}

interface AuditLogTableProps {
  rows: AdminAuditLog[]
  actorSeed: (log: AdminAuditLog) => string
  actionBadgeClass: (action: string) => string
  formatTimestamp: (iso: string) => string
  formatDetails: (log: AdminAuditLog) => string
}

const AuditLogTable = ({
  rows,
  actorSeed,
  actionBadgeClass,
  formatTimestamp,
  formatDetails,
}: AuditLogTableProps) => (
  <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='bg-dark text-white text-left'>
            <th className='px-4 py-3 font-black'>Timestamp</th>
            <th className='px-4 py-3 font-black'>Actor</th>
            <th className='px-4 py-3 font-black'>Action</th>
            <th className='px-4 py-3 font-black'>Target</th>
            <th className='px-4 py-3 font-black hidden lg:table-cell'>IP</th>
            <th className='px-4 py-3 font-black hidden xl:table-cell'>
              Details
            </th>
          </tr>
        </thead>
        <tbody className='divide-y-2 divide-dark'>
          {rows.map((log) => (
            <tr key={log.id} className='hover:bg-inputBg transition-colors'>
              <td className='px-4 py-3 font-bold whitespace-nowrap'>
                {formatTimestamp(log.createdAt)}
              </td>
              <td className='px-4 py-3'>
                <div className='flex items-center gap-2'>
                  <div className='w-7 h-7 rounded-full border-2 border-dark bg-purpleSoft overflow-hidden shrink-0'>
                    <Image
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${actorSeed(log)}`}
                      alt={log.actorName ?? 'System'}
                      width={28}
                      height={28}
                      unoptimized
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <span className='font-black'>{log.actorName ?? 'System'}</span>
                </div>
              </td>
              <td className='px-4 py-3'>
                <span
                  className={`font-black ${actionBadgeClass(log.action)} border-2 border-dark px-2 py-0.5 rounded whitespace-nowrap`}
                >
                  {log.action}
                </span>
              </td>
              <td className='px-4 py-3 font-bold max-w-xs truncate'>
                {log.targetName ?? '—'}
              </td>
              <td className='px-4 py-3 font-mono text-xs text-gray-600 hidden lg:table-cell'>
                {log.ip ?? '—'}
              </td>
              <td className='px-4 py-3 font-medium text-gray-600 hidden xl:table-cell max-w-md truncate'>
                {formatDetails(log)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

interface AuditLogPaginationProps {
  page: number
  totalPages: number
  total: number
  fromCount: number
  toCount: number
  perPage: number
  pageNumbers: (number | '…')[]
  onPageChange: (page: number) => void
  onPerPageChange: (size: number) => void
}

const AuditLogPagination = ({
  page,
  totalPages,
  total,
  fromCount,
  toCount,
  perPage,
  pageNumbers,
  onPageChange,
  onPerPageChange,
}: AuditLogPaginationProps) => (
  <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal border-t-0 rounded-t-none px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
    <p className='text-xs font-bold text-gray-600'>
      Showing <span className='font-black text-dark'>{fromCount}–{toCount}</span>{' '}
      of <span className='font-black text-dark'>{total}</span> events
    </p>
    <div className='flex items-center gap-1.5'>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className='btn-brutal bg-white border-2 border-dark px-3 py-1.5 rounded-lg font-black shadow-brutal-sm disabled:opacity-40 disabled:cursor-not-allowed'
      >
        Prev
      </button>
      {pageNumbers.map((num, index) =>
        num === '…' ? (
          <span key={`dots-${index}`} className='font-black text-gray-500 px-1'>
            …
          </span>
        ) : (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`btn-brutal border-2 border-dark px-3 py-1.5 rounded-lg font-black shadow-brutal-sm ${
              num === page ? 'bg-secondary' : 'bg-white'
            }`}
          >
            {num}
          </button>
        ),
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className='btn-brutal bg-white border-2 border-dark px-3 py-1.5 rounded-lg font-black shadow-brutal-sm disabled:opacity-40 disabled:cursor-not-allowed'
      >
        Next
      </button>
    </div>
    <select
      value={perPage}
      onChange={(e) => onPerPageChange(parseInt(e.target.value, 10))}
      className='bg-white border-2 border-dark px-3 py-1.5 rounded-lg font-black shadow-brutal-sm cursor-pointer'
    >
      {[20, 50, 100].map((size) => (
        <option key={size} value={size}>
          {size} / page
        </option>
      ))}
    </select>
  </div>
)

export default AuditLogsClient