'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { likeProject } from '@/store/redux/projectsSlice'
import { addBookmark, removeBookmark } from '@/store/redux/bookmarksSlice'
import {
  fetchComments,
  addComment,
  deleteComment,
  clearComments,
} from '@/store/redux/commentsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const ProjectDetailClient = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const router = useRouter()

  const project = useSelector((state: any) =>
    state.projects.items.find((p: any) => p.id === id),
  )
  const { currentUser } = useSelector((state: any) => state.auth)
  const { items: bookmarks } = useSelector((state: any) => state.bookmarks)
  const { items: comments, loading: commentsLoading } = useSelector(
    (state: any) => state.comments,
  )

  const existingBookmark = bookmarks.find((b: any) => b.project_id === id)
  const isBookmarked = !!existingBookmark
  const [comment, setComment] = useState('')

  useEffect(() => {
    dispatch(fetchComments(id) as any)
    return () => {
      dispatch(clearComments())
    }
  }, [id, dispatch])

  const handleLike = () => {
    dispatch(likeProject({ id, currentLikes: project.likes }) as any)
  }

  const handleBookmark = () => {
    if (!currentUser) return router.push('/login')
    if (isBookmarked) {
      dispatch(removeBookmark({ bookmarkId: existingBookmark.id }) as any)
    } else {
      dispatch(addBookmark({ user_id: currentUser.id, project_id: id }) as any)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    if (!currentUser) return router.push('/login')
    await dispatch(
      addComment({
        content: comment.trim(),
        user_id: currentUser.id,
        project_id: id,
      }) as any,
    )
    setComment('')
  }

  const handleDeleteComment = (commentId: string) => {
    dispatch(deleteComment(commentId) as any)
  }

  if (!project) {
    return (
      <div className='bg-gray-50 min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 max-w-4xl mx-auto px-4 py-12 w-full'>
          <p className='text-sm text-gray-500'>Project not found.</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-4xl mx-auto px-4 py-12 w-full'>
        <Link
          href='/'
          className='text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6 inline-block'
        >
          ← Back to projects
        </Link>

        <div className='bg-white border border-gray-200 rounded-xl p-6 mb-6'>
          <div className='mb-4'>
            <span className='text-xs bg-blue-50 text-primary border border-blue-100 px-2 py-0.5 rounded-md font-medium'>
              {project.category}
            </span>
            <h1 className='text-2xl font-semibold text-gray-900 mt-3 mb-2'>
              {project.title}
            </h1>
            <p className='text-sm text-gray-500 leading-relaxed'>
              {project.description}
            </p>
          </div>

          <div className='flex flex-wrap gap-1.5 mb-4'>
            {project.technologies?.map((tech: string) => (
              <span
                key={tech}
                className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded'
              >
                {tech}
              </span>
            ))}
          </div>

          <div className='flex items-center gap-2 mb-6'>
            <img
              src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${project.author}`}
              className='w-6 h-6 rounded-full border border-gray-200'
              alt={project.author}
            />
            <span className='text-xs text-gray-500'>{project.author}</span>
          </div>

          <div className='flex items-center gap-3 pt-4 border-t border-gray-100'>
            <button
              onClick={handleLike}
              className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors'
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
              </svg>
              {project.likes} likes
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                isBookmarked
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' />
              </svg>
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>

            <div className='flex items-center gap-3 ml-auto'>
              {project.github && project.github !== '#' && (
                <a
                  href={project.github}
                  target='_blank'
                  rel='noreferrer'
                  className='text-sm text-gray-500 hover:text-gray-900 transition-colors'
                >
                  GitHub →
                </a>
              )}
              {project.live && project.live !== '#' && (
                <a
                  href={project.live}
                  target='_blank'
                  rel='noreferrer'
                  className='text-sm text-primary hover:text-primary-hover transition-colors'
                >
                  Live Demo →
                </a>
              )}
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-xl p-6'>
          <h2 className='text-base font-semibold text-gray-900 mb-4'>
            Comments ({comments.length})
          </h2>

          {currentUser ? (
            <form onSubmit={handleAddComment} className='mb-6'>
              <div className='flex items-start gap-3'>
                <img
                  src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${currentUser.email}`}
                  className='w-7 h-7 rounded-full border border-gray-200 shrink-0'
                  alt={currentUser.name}
                />
                <div className='flex-1'>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder='Write a comment...'
                    className='w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none'
                  />
                  <button
                    type='submit'
                    className='mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors'
                  >
                    Post comment
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <p className='text-sm text-gray-500 mb-6'>
              <Link
                href='/login'
                className='text-primary hover:text-primary-hover transition-colors'
              >
                Log in
              </Link>{' '}
              to leave a comment.
            </p>
          )}

          {commentsLoading && (
            <p className='text-sm text-gray-400'>Loading comments...</p>
          )}

          {!commentsLoading && comments.length === 0 && (
            <p className='text-sm text-gray-400 text-center py-6'>
              No comments yet. Be the first to comment.
            </p>
          )}

          {!commentsLoading && comments.length > 0 && (
            <div className='flex flex-col gap-4'>
              {comments.map((c: any) => (
                <div key={c.id} className='flex items-start gap-3'>
                  <img
                    src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${c.author_name}`}
                    className='w-7 h-7 rounded-full border border-gray-200 shrink-0'
                    alt={c.author_name}
                  />
                  <div className='flex-1 bg-gray-50 rounded-lg px-3 py-2'>
                    <div className='flex items-center justify-between mb-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-gray-900'>
                          {c.author_name}
                        </span>
                        <span className='text-xs text-gray-400'>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {currentUser?.id === c.user_id && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className='text-xs text-red-400 hover:text-red-600 transition-colors'
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className='text-sm text-gray-700'>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ProjectDetailClient
