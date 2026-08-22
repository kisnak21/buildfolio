'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ModerationDialog from '@/components/admin/ModerationDialog'
import AdminPagination from '@/components/admin/AdminPagination'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  deleteAdminComment,
  getAdminComments,
  moderateAdminComment,
  type AdminComment,
  type ListResponse,
} from '@/lib/api/adminApi'

const emptyPagination: ListResponse<AdminComment>['pagination'] = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

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

const CommentsClient = () => {
  const dispatch = useAppDispatch()
  const [comments, setComments] = useState<AdminComment[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmComment, setConfirmComment] = useState<AdminComment | null>(null)
  const [hideComment, setHideComment] = useState<AdminComment | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAdminComments({
      page,
      limit: 20,
      search: deferredQuery.trim() || undefined,
      status: status || undefined,
    })
      .then((result) => {
        if (cancelled) return
        setComments(result.data)
        setPagination(result.pagination)
        setError('')
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load comments')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [deferredQuery, page, status])

  const refresh = async () => {
    setLoading(true)
    try {
      const result = await getAdminComments({
        page,
        limit: 20,
        search: deferredQuery.trim() || undefined,
        status: status || undefined,
      })
      setComments(result.data)
      setPagination(result.pagination)
      setError('')
      return result
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const refreshAfterMutation = async () => {
    const result = await refresh()
    if (result?.data.length === 0 && result.pagination.total > 0 && page > 1) {
      setPage((current) => current - 1)
    }
  }

  const hide = async ({ reason }: { reason: string }) => {
    if (!hideComment) return
    try {
      await moderateAdminComment(hideComment.id, { hidden: true, reason })
      await refreshAfterMutation()
      dispatch(
        showToast({
          message: `Comment from ${hideComment.author} hidden`,
          type: 'success',
        }),
      )
      setHideComment(null)
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Hide failed',
          type: 'error',
        }),
      )
      throw err
    }
  }

  const toggleVisibility = async (comment: AdminComment) => {
    if (!comment.hiddenAt) {
      setHideComment(comment)
      return
    }
    setBusyId(comment.id)
    try {
      await moderateAdminComment(comment.id, { hidden: false })
      await refreshAfterMutation()
      dispatch(
        showToast({
          message: `Comment from ${comment.author} visible again`,
          type: 'success',
        }),
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

  const handleDelete = async () => {
    if (!confirmComment) return
    setBusyId(confirmComment.id)
    try {
      await deleteAdminComment(confirmComment.id)
      await refreshAfterMutation()
      dispatch(
        showToast({
          message: `Comment from ${confirmComment.author} deleted`,
          type: 'success',
        }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Delete failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
      setConfirmComment(null)
    }
  }

  const actionBtn = (tone: 'primary' | 'danger' | 'warning') =>
    `${buttonClass('ghost', 'sm', 'min-h-11')} ${
      tone === 'primary'
        ? 'bg-primary hover:bg-primaryDark hover:text-white'
        : tone === 'danger'
          ? 'bg-dangerSoft hover:bg-danger hover:text-white'
          : 'bg-warningSoft hover:bg-warning'
    }`.replace('border-transparent shadow-none', 'border-2 shadow-brutal-sm')

  return (
    <div>
      <div className='flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Comments</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Hide violations without destroying the moderation record.
          </p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto'>
          <input
            type='search'
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder='Search comments'
            className='min-h-11 w-full lg:w-64 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm'
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className='min-h-11 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm'
          >
            <option value=''>All states</option>
            <option value='visible'>Visible</option>
            <option value='hidden'>Hidden</option>
          </select>
        </div>
      </div>

      {error && !loading && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <p className='font-bold text-sm'>{error}</p>
          <button onClick={refresh} className={buttonClass('primary', 'sm')}>
            Retry
          </button>
        </div>
      )}

      <div className='space-y-4'>
        {loading && (
          <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal font-bold text-gray-600'>
            Loading comment moderation queue…
          </div>
        )}
        {!loading && comments.length === 0 && (
          <div className='bg-white border-4 border-dark rounded-2xl p-8 shadow-brutal text-center font-bold text-gray-600'>
            No comments match these filters.
          </div>
        )}
        {!loading &&
          comments.map((comment) => (
            <article
              key={comment.id}
              className={`border-4 border-dark rounded-2xl p-5 shadow-brutal ${
                comment.hiddenAt ? 'bg-dangerSoft' : 'bg-white'
              }`}
            >
              <div className='flex items-start gap-3 mb-3'>
                <Image
                  src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${comment.author.toLowerCase().replace(/\s/g, '')}`}
                  alt=''
                  width={36}
                  height={36}
                  unoptimized
                  className='w-9 h-9 rounded-full border-2 border-dark bg-successSoft shrink-0'
                />
                <div className='leading-tight min-w-0 flex-1'>
                  <p className='font-black text-sm'>
                    {comment.author}{' '}
                    <span className='text-gray-600 font-bold'>on</span>{' '}
                    {comment.project}
                  </p>
                  <div className='flex flex-wrap items-center gap-2 mt-1'>
                    <span className='text-xs font-bold text-gray-600'>
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    {comment.hiddenAt && (
                      <span className='border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black bg-white'>
                        hidden
                      </span>
                    )}
                  </div>
                </div>
                <div className='flex flex-wrap justify-end gap-2'>
                  <button
                    disabled={busyId === comment.id}
                    onClick={() => toggleVisibility(comment)}
                    className={actionBtn(comment.hiddenAt ? 'primary' : 'warning')}
                  >
                    {comment.hiddenAt ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    disabled={busyId === comment.id}
                    onClick={() => setConfirmComment(comment)}
                    className={actionBtn('danger')}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className='font-medium text-gray-800 sm:pl-12'>{comment.content}</p>
              {comment.hiddenReason && (
                <p className='mt-3 sm:ml-12 text-xs font-bold border-t-2 border-dark/20 pt-2'>
                  Moderator reason: {comment.hiddenReason}
                </p>
              )}
            </article>
          ))}
      </div>

      <div className='mt-6 bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          label='comments'
          onPageChange={(nextPage) => {
            setLoading(true)
            setPage(nextPage)
          }}
        />
      </div>

      {hideComment && (
        <ModerationDialog
          key={hideComment.id}
          title={`Hide comment from ${hideComment.author}?`}
          message='The comment will disappear from the project page but remain available to administrators.'
          confirmLabel='Hide comment'
          onConfirm={hide}
          onCancel={() => setHideComment(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmComment}
        title='Delete comment?'
        message={`This action cannot be undone. The comment from ${confirmComment?.author} will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmComment(null)}
      />
    </div>
  )
}

export default CommentsClient
