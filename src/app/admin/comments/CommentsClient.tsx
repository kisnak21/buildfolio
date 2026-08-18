'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  getAdminComments,
  deleteAdminComment,
  type AdminComment,
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

const CommentsClient = () => {
  const dispatch = useAppDispatch()
  const [comments, setComments] = useState<AdminComment[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmComment, setConfirmComment] = useState<AdminComment | null>(
    null,
  )
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      const result = await getAdminComments()
      setComments(result.data)
      setTotal(result.pagination.total)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getAdminComments()
      .then((result) => {
        if (cancelled) return
        setComments(result.data)
        setTotal(result.pagination.total)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load comments')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return comments
    return comments.filter(
      (c) =>
        c.author.toLowerCase().includes(q) ||
        c.project.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q),
    )
  }, [comments, query])

  const handleDelete = async () => {
    if (!confirmComment) return
    setBusyId(confirmComment.id)
    try {
      await deleteAdminComment(confirmComment.id)
      setComments(comments.filter((c) => c.id !== confirmComment.id))
      setTotal((t) => t - 1)
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

  const actionBtn = (variant: 'white' | 'danger') =>
    `${buttonClass('ghost', 'sm', '')} ${
      variant === 'danger'
        ? 'bg-dangerSoft hover:bg-danger hover:text-white'
        : 'bg-white hover:bg-inputBg'
    }`.replace('border-transparent shadow-none', 'border-2 shadow-brutal-sm')

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Comments</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Review and moderate community feedback.
          </p>
        </div>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search comments...'
          className='w-full md:w-64 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary'
        />
      </div>

      {error && !loading && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
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

      <div className='space-y-4'>
        {loading && (
          <div className='bg-white border-4 border-dark rounded-2xl p-5 shadow-brutal animate-pulse'>
            <div className='h-6 w-2/3 bg-gray-200 rounded mb-4' />
            <div className='h-4 w-1/2 bg-gray-200 rounded' />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className='bg-white border-4 border-dark rounded-2xl p-8 shadow-brutal text-center font-bold text-gray-500'>
            No comments found
          </div>
        )}
        {filtered.map((comment) => (
          <div
            key={comment.id}
            className='bg-white border-4 border-dark rounded-2xl p-5 shadow-brutal'
          >
            <div className='flex items-center gap-3 mb-3 flex-wrap'>
              <div className='w-9 h-9 rounded-full border-2 border-dark bg-successSoft overflow-hidden shrink-0'>
                <Image
                  src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${comment.author.toLowerCase().replace(/\s/g, '')}`}
                  alt={comment.author}
                  width={36}
                  height={36}
                  unoptimized
                  className='w-full h-full object-cover'
                />
              </div>
              <div className='leading-tight min-w-0'>
                <p className='font-black text-sm truncate'>
                  {comment.author}{' '}
                  <span className='text-gray-400 font-bold'>on</span>{' '}
                  {comment.project}
                </p>
                <p className='text-xs font-bold text-gray-500'>
                  {formatRelativeTime(comment.createdAt)}
                </p>
              </div>
              <div className='ml-auto flex items-center gap-2'>
                <button
                  disabled={busyId === comment.id}
                  onClick={() => setConfirmComment(comment)}
                  className={`${actionBtn('danger')} ${
                    busyId === comment.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
            <p className='font-medium text-gray-700 pl-12'>{comment.content}</p>
          </div>
        ))}
      </div>

      <div className='p-4 flex items-center justify-between'>
        <p className='text-sm font-bold text-gray-500'>
          Showing {filtered.length} of {total} comments
        </p>
      </div>

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