'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { buttonClass } from '@/components/ui/buttonClass'
import { adminComments, type AdminComment } from '@/lib/adminMockData'

const CommentsClient = () => {
  const dispatch = useAppDispatch()
  const [comments, setComments] = useState(adminComments)
  const [query, setQuery] = useState('')
  const [confirmComment, setConfirmComment] = useState<AdminComment | null>(
    null,
  )

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

  const handleDelete = () => {
    if (!confirmComment) return
    setComments(comments.filter((c) => c.id !== confirmComment.id))
    dispatch(
      showToast({
        message: `Comment from ${confirmComment.author} deleted`,
        type: 'success',
      }),
    )
    setConfirmComment(null)
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

      <div className='space-y-4'>
        {filtered.map((comment) => (
          <div
            key={comment.id}
            className={`bg-white border-4 border-dark rounded-2xl p-5 shadow-brutal ${
              comment.flagged ? 'border-dangerSoft' : ''
            }`}
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
                  {comment.time}
                </p>
              </div>
              <div className='ml-auto flex items-center gap-2 flex-wrap'>
                {comment.flagged && (
                  <span className='text-xs font-black bg-dangerSoft border-2 border-dark px-2 py-0.5 rounded shadow-brutal-sm'>
                    Flagged
                  </span>
                )}
                {!comment.flagged && (
                  <button
                    onClick={() =>
                      dispatch(
                        showToast({
                          message: 'Konteks proyek menyusul di fase backend',
                          type: 'info',
                        }),
                      )
                    }
                    className={actionBtn('white')}
                  >
                    View context
                  </button>
                )}
                <button
                  onClick={() => setConfirmComment(comment)}
                  className={actionBtn('danger')}
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
          Showing {filtered.length} of {comments.length} comments
        </p>
        <div className='flex gap-2'>
          <button
            disabled
            className='bg-white border-2 border-dark px-3 py-1.5 rounded-lg text-xs font-bold shadow-brutal-sm opacity-50 cursor-not-allowed'
          >
            Prev
          </button>
          <button
            onClick={() =>
              dispatch(
                showToast({
                  message: 'Pagination backend menyusul',
                  type: 'info',
                }),
              )
            }
            className='bg-secondary border-2 border-dark px-3 py-1.5 rounded-lg text-xs font-bold shadow-brutal-sm hover:bg-warningSoft transition-colors'
          >
            Next
          </button>
        </div>
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