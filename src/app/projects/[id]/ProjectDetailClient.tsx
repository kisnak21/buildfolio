'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { likeProject as likeProjectThunk } from '@/store/redux/projectsSlice'
import { addBookmark, removeBookmark } from '@/store/redux/bookmarksSlice'
import {
  fetchComments,
  addComment,
  deleteComment,
  clearComments,
} from '@/store/redux/commentsSlice'
import { getProjectById } from '@/lib/api/projectsApi'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import ProjectDetailSkeleton from '@/components/ui/ProjectDetailSkeleton'
import {
  HeartIcon as HeartOutline,
  BookmarkIcon as BookmarkOutline,
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
  ArrowLeftIcon,
} from '@heroicons/react/24/solid'

// Generate consistent background color based on category
const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    SaaS: 'bg-secondary',
    AI: 'bg-[#a78bfa] text-white',
    'Web App': 'bg-[#c4f0ff]',
    'Mobile App': 'bg-[#fecaca]',
    'Open Source': 'bg-[#fde047]',
    Game: 'bg-[#4ade80]',
  }
  return map[category] || 'bg-secondary'
}

const ProjectDetailClient = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const router = useRouter()

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { currentUser } = useAppSelector((state) => state.auth)
  const { items: bookmarks } = useAppSelector((state) => state.bookmarks)
  const { items: comments, loading: commentsLoading } = useAppSelector(
    (state) => state.comments,
  )

  const existingBookmark = bookmarks.find(
    (b: any) => String(b.project_id) === id,
  )
  const isBookmarked = !!existingBookmark
  const [comment, setComment] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([getProjectById(id), dispatch(fetchComments(id) as any)])
      .then(([projectData]) => {
        if (mounted) setProject(projectData)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
      dispatch(clearComments())
    }
  }, [id, dispatch])

  const handleLike = async () => {
    const result = await dispatch(likeProjectThunk(id) as any)
    if (likeProjectThunk.fulfilled.match(result)) {
      const liked = result.payload?.liked
      dispatch(
        showToast({
          message: liked ? 'You liked this project!' : 'You removed your like.',
          type: liked ? 'success' : 'info',
        }),
      )
    }
  }

  const handleBookmark = () => {
    if (!currentUser) return router.push('/login')
    if (isBookmarked) {
      dispatch(removeBookmark({ bookmarkId: existingBookmark.id }) as any)
      dispatch(showToast({ message: 'Bookmark removed.', type: 'info' }))
    } else {
      dispatch(addBookmark({ project_id: id }) as any)
      dispatch(showToast({ message: 'Project bookmarked!', type: 'success' }))
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    if (!currentUser) return router.push('/login')
    await dispatch(
      addComment({
        content: comment.trim(),
        project_id: id,
      }) as any,
    )
    dispatch(showToast({ message: 'Comment posted!', type: 'success' }))
    setComment('')
  }

  const handleDeleteComment = (commentId: string) => {
    dispatch(deleteComment(commentId) as any)
    dispatch(showToast({ message: 'Comment deleted.', type: 'info' }))
  }

  const catColor = project ? getCategoryColor(project.category) : ''
  const isLightText = catColor.includes('text-white')
    ? 'text-white'
    : 'text-dark'

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-4xl mx-auto px-4 py-12 w-full'>
        <Link
          href='/projects'
          className='btn-brutal bg-white border-2 border-dark px-4 py-2 rounded-xl font-bold shadow-brutal-sm text-sm mb-8 inline-flex items-center gap-2 hover:bg-yellow-50'
        >
          <ArrowLeftIcon className='w-4 h-4' />
          Back to projects
        </Link>

        {loading ? (
          <ProjectDetailSkeleton />
        ) : !project ? (
          <div className='bg-white border-4 border-dark rounded-2xl p-12 text-center shadow-brutal'>
            <p className='text-lg font-bold text-gray-500'>
              Project not found.
            </p>
          </div>
        ) : (
          <>
            <div className='bg-white border-4 border-dark rounded-2xl p-8 mb-8 shadow-brutal relative'>
              {/* Category Tag */}
              <div
                className={`inline-block border-2 border-dark px-3 py-1 rounded-md text-sm font-bold shadow-brutal-sm ${catColor} ${isLightText} mb-6`}
              >
                {project.category || 'Uncategorized'}
              </div>

              <h1 className='text-4xl font-black text-dark mb-4'>
                {project.title}
              </h1>

              <p className='text-lg font-medium text-gray-700 leading-relaxed mb-6'>
                {project.description}
              </p>

              {/* Tech Pills */}
              <div className='flex flex-wrap gap-2 mb-6'>
                {project.technologies?.map((tech: string) => (
                  <span
                    key={tech}
                    className='bg-gray-100 border-2 border-dark px-3 py-1 rounded-md text-xs font-bold'
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Author Info */}
              <div className='flex items-center gap-3 border-t-2 border-dark border-dashed pt-6 mb-6'>
                <Image
                  src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${project.author}`}
                  className='w-10 h-10 rounded-full border-2 border-dark bg-yellow-100'
                  alt={project.author}
                  width={40}
                  height={40}
                  unoptimized
                />
                <div>
                  <p className='text-sm font-bold text-dark'>
                    {project.author}
                  </p>
                  <p className='text-xs font-bold text-gray-400'>Creator</p>
                </div>
              </div>

              {/* Buttons Actions */}
              <div className='flex flex-wrap items-center gap-4 pt-6 border-t-2 border-dark border-dashed'>
                <button
                  onClick={handleLike}
                  className='btn-brutal bg-white border-2 border-dark px-5 py-3 rounded-xl font-bold shadow-brutal-sm flex items-center gap-2 text-sm hover:bg-pink-50'
                >
                  <HeartSolid className='w-5 h-5 text-primary' />
                  <span className='font-bold'>{project.likes} Likes</span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`btn-brutal border-2 border-dark px-5 py-3 rounded-xl font-bold shadow-brutal-sm flex items-center gap-2 text-sm ${
                    isBookmarked
                      ? 'bg-primary text-dark'
                      : 'bg-white hover:bg-yellow-50'
                  }`}
                >
                  {isBookmarked ? (
                    <BookmarkSolid className='w-5 h-5 text-dark' />
                  ) : (
                    <BookmarkOutline className='w-5 h-5 text-dark' />
                  )}
                  <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                </button>

                <div className='flex items-center gap-4 ml-auto'>
                  {project.github && project.github !== '#' && (
                    <a
                      href={project.github}
                      target='_blank'
                      rel='noreferrer'
                      className='btn-brutal bg-dark text-white border-2 border-dark px-6 py-3 rounded-xl font-bold text-sm shadow-brutal-sm'
                    >
                      GitHub
                    </a>
                  )}
                  {project.live && project.live !== '#' && (
                    <a
                      href={project.live}
                      target='_blank'
                      rel='noreferrer'
                      className='btn-brutal bg-accent text-white border-2 border-dark px-6 py-3 rounded-xl font-bold text-sm shadow-brutal-sm hover:bg-accentDark'
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className='bg-white border-4 border-dark rounded-2xl p-8 shadow-brutal'>
              <h2 className='text-2xl font-black text-dark mb-6'>
                Comments ({comments.length})
              </h2>

              {currentUser ? (
                <form
                  onSubmit={handleAddComment}
                  className='mb-8 border-b-2 border-dark border-dashed pb-8'
                >
                  <div className='flex items-start gap-4'>
                    <Image
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${currentUser.email}`}
                      className='w-10 h-10 rounded-full border-2 border-dark bg-yellow-100 shrink-0'
                      alt={currentUser.name}
                      width={40}
                      height={40}
                      unoptimized
                    />
                    <div className='flex-1'>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder='Write a feedback...'
                        className='input-brutal w-full bg-[#f3f4f6] border-2 border-dark rounded-xl px-4 py-3 font-medium text-dark shadow-brutal-sm resize-none'
                      />
                      <Button
                        type='submit'
                        variant='primary'
                        className='mt-3 font-bold'
                      >
                        Post comment
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className='font-bold text-dark mb-8 border-b-2 border-dark border-dashed pb-8 text-center bg-yellow-50 py-4 border-2 rounded-xl'>
                  <Link href='/login' className='text-primary hover:underline'>
                    Log in
                  </Link>{' '}
                  to leave a comment.
                </p>
              )}

              {commentsLoading && (
                <p className='text-sm font-bold text-gray-400'>
                  Loading comments...
                </p>
              )}

              {!commentsLoading && comments.length === 0 && (
                <p className='font-bold text-gray-400 text-center py-6'>
                  No comments yet. Be the first to comment.
                </p>
              )}

              {!commentsLoading && comments.length > 0 && (
                <div className='flex flex-col gap-6'>
                  {comments.map((c: any) => (
                    <div
                      key={c.id}
                      className='flex items-start gap-4 border-b-2 border-dark border-dashed pb-6 last:border-b-0 last:pb-0'
                    >
                      <Image
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${c.author_name}`}
                        className='w-10 h-10 rounded-full border-2 border-dark bg-blue-50 shrink-0'
                        alt={c.author_name}
                        width={40}
                        height={40}
                        unoptimized
                      />
                      <div className='flex-1 bg-[#fdfcf7] border-2 border-dark rounded-xl px-4 py-3 shadow-brutal-sm'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='font-bold text-dark'>
                              {c.author_name}
                            </span>
                            <span className='text-xs font-bold text-gray-400'>
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {currentUser?.id === c.user_id && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className='text-xs font-bold text-red-500 hover:underline'
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className='font-medium text-gray-800 leading-relaxed'>
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default ProjectDetailClient
