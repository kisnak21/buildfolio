'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { likeProject as likeProjectThunk } from '@/store/redux/projectsSlice'
import { fetchLikedProjects, syncLike, selectIsLiked } from '@/store/redux/likesSlice'
import {
  addBookmark,
  fetchBookmarks,
  removeBookmark,
} from '@/store/redux/bookmarksSlice'
import {
  fetchComments,
  addComment,
  deleteComment,
  clearComments,
} from '@/store/redux/commentsSlice'
import { getProjectById } from '@/lib/api/projectsApi'
import type { NormalizedProject } from '@/lib/api/projectsApi'
import { getCategoryColor, isCategoryLightText } from '@/lib/categoryColors'
import { shareProject } from '@/lib/shareProject'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import ProjectDetailSkeleton from '@/components/ui/ProjectDetailSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ReportModal, {
  type ReportTarget,
} from '@/components/ReportModal'
import {
  HeartIcon as HeartOutline,
  BookmarkIcon as BookmarkOutline,
  FlagIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
  ArrowLeftIcon,
} from '@heroicons/react/24/solid'


interface ProjectDetailClientProps {
  initialProject: NormalizedProject | null
}

const ProjectDetailClient = ({ initialProject }: ProjectDetailClientProps) => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const router = useRouter()

  const [project, setProject] = useState<NormalizedProject | null>(initialProject)
  const [loading, setLoading] = useState(!initialProject)

  const { currentUser } = useAppSelector((state) => state.auth)
  const { items: bookmarks } = useAppSelector((state) => state.bookmarks)
  const isLiked = useAppSelector(selectIsLiked(id))
  const { items: comments, loading: commentsLoading } = useAppSelector(
    (state) => state.comments,
  )

  const existingBookmark = bookmarks.find(
    (b) => String(b.project_id) === id,
  )
  const isBookmarked = !!existingBookmark
  const [comment, setComment] = useState('')
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [reportedSet, setReportedSet] = useState<Set<string>>(new Set())

  const openReport = (target: ReportTarget) => {
    if (!currentUser) {
      dispatch(
        showToast({
          message: 'Log in to report content',
          type: 'error',
        }),
      )
      return
    }
    setReportTarget(target)
  }

  useEffect(() => {
    let mounted = true

    Promise.all([getProjectById(id), dispatch(fetchComments(id))])
      .then(([projectData]) => {
        if (mounted) setProject(projectData)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    if (currentUser?.id) {
      dispatch(fetchLikedProjects())
      dispatch(fetchBookmarks())
    }

    return () => {
      mounted = false
      dispatch(clearComments())
    }
  }, [id, dispatch, currentUser?.id])

  const handleLike = async () => {
    if (!currentUser) return router.push('/login')
    const result = await dispatch(likeProjectThunk(id))
    if (likeProjectThunk.fulfilled.match(result)) {
      const liked = result.payload?.liked
      if (project) dispatch(syncLike({ project, liked }))
      dispatch(
        showToast({
          message: liked ? 'You liked this project!' : 'You removed your like.',
          type: liked ? 'success' : 'info',
        }),
      )
    }
  }

  const handleBookmark = async () => {
    if (!currentUser) return router.push('/login')
    if (isBookmarked) {
      const result = await dispatch(removeBookmark({ bookmarkId: existingBookmark.id }))
      if (removeBookmark.fulfilled.match(result)) {
        dispatch(showToast({ message: 'Bookmark removed.', type: 'info' }))
      }
    } else {
      const result = await dispatch(addBookmark({ project_id: id }))
      if (addBookmark.fulfilled.match(result)) {
        await dispatch(fetchBookmarks())
        dispatch(showToast({ message: 'Project bookmarked!', type: 'success' }))
      }
    }
  }

  const handleShare = async () => {
    if (!project) return
    try {
      const result = await shareProject({
        title: project.title,
        description: project.description,
        url: window.location.href,
      })
      dispatch(
        showToast({
          message: result === 'copied' ? 'Project link copied.' : 'Project shared.',
          type: 'success',
        }),
      )
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      dispatch(showToast({ message: 'Could not share project.', type: 'error' }))
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    if (!currentUser) return router.push('/login')
    const result = await dispatch(
      addComment({
        content: comment.trim(),
        project_id: id,
      }),
    )
    if (addComment.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Comment posted!', type: 'success' }))
      setComment('')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const result = await dispatch(deleteComment(commentId))
    if (deleteComment.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Comment deleted.', type: 'info' }))
    }
  }

  const catColor = project ? getCategoryColor(project.category) : ''
  const isLightText = isCategoryLightText(project?.category ?? '')
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
          <EmptyState title='Project not found.' />
        ) : (
          <>
            <div className='bg-white border-4 border-dark rounded-2xl p-8 mb-8 shadow-brutal relative'>
              <button
                onClick={() => openReport({ type: 'project', id })}
                disabled={reportedSet.has(id)}
                className='absolute top-4 right-4 flex items-center gap-1.5 text-xs font-black border-2 border-dark bg-white px-3 py-1.5 rounded-lg hover:bg-warningSoft transition-colors disabled:opacity-40 disabled:hover:bg-white'
                title='Report this project'
              >
                <FlagIcon className='w-4 h-4' />
                {reportedSet.has(id) ? 'Reported' : 'Report'}
              </button>
              {project.thumbnail && (
                <div className='relative w-full aspect-video border-2 border-dark rounded-xl overflow-hidden mb-6 shadow-brutal-sm'>
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    sizes='(max-width: 1024px) 100vw, 896px'
                    className='object-cover'
                  />
                </div>
              )}
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
                  <p className='text-xs font-bold text-gray-600'>Creator</p>
                </div>
              </div>

              {/* Buttons Actions */}
              <div className='flex flex-wrap items-center gap-4 pt-6 border-t-2 border-dark border-dashed'>
                <button
                  onClick={handleLike}
                  className={`btn-brutal border-2 border-dark px-5 py-3 rounded-xl font-bold shadow-brutal-sm flex items-center gap-2 text-sm ${
                    isLiked ? 'bg-primary text-dark' : 'bg-white text-dark hover:bg-pink-50'
                  }`}
                >
                  {isLiked ? (
                    <HeartSolid className='w-5 h-5 text-dark' />
                  ) : (
                    <HeartOutline className='w-5 h-5 text-dark' />
                  )}
                  <span className='font-bold'>{project.likes} {isLiked ? 'Liked' : 'Likes'}</span>
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

                <button
                  type='button'
                  onClick={() => void handleShare()}
                  className='btn-brutal flex min-h-11 items-center gap-2 rounded-xl border-2 border-dark bg-white px-5 py-3 text-sm font-bold shadow-brutal-sm hover:bg-secondary'
                >
                  <ShareIcon className='h-5 w-5' aria-hidden />
                  Share
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
                        className='input-brutal w-full bg-inputBg border-2 border-dark rounded-xl px-4 py-3 font-medium text-dark shadow-brutal-sm resize-none'
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
                  <Link href='/login' className='text-primaryDark hover:underline'>
                    Log in
                  </Link>{' '}
                  to leave a comment.
                </p>
              )}

              {commentsLoading && (
                <p className='text-sm font-bold text-gray-600'>
                  Loading comments...
                </p>
              )}

              {!commentsLoading && comments.length === 0 && (
                <p className='font-bold text-gray-600 text-center py-6'>
                  No comments yet. Be the first to comment.
                </p>
              )}

              {!commentsLoading && comments.length > 0 && (
                <div className='flex flex-col gap-6'>
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className='flex items-start gap-4 border-b-2 border-dark border-dashed pb-6 last:border-b-0 last:pb-0'
                    >
                      <Image
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${c.author_name ?? 'anon'}`}
                        className='w-10 h-10 rounded-full border-2 border-dark bg-blue-50 shrink-0'
                        alt={c.author_name ?? 'anonymous'}
                        width={40}
                        height={40}
                        unoptimized
                      />
                      <div className='flex-1 bg-bgMain border-2 border-dark rounded-xl px-4 py-3 shadow-brutal-sm'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='font-bold text-dark'>
                              {c.author_name ?? 'anonymous'}
                            </span>
                            <span className='text-xs font-bold text-gray-600'>
                              {c.created_at
                                ? new Date(c.created_at).toLocaleDateString()
                                : ''}
                            </span>
                          </div>
                          {currentUser?.id === c.user_id && (
                            <button
                              onClick={() => handleDeleteComment(String(c.id))}
                              className='text-xs font-bold text-red-600 hover:underline'
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={() =>
                              openReport({ type: 'comment', id: String(c.id) })
                            }
                            disabled={reportedSet.has(String(c.id))}
                            className='text-xs font-bold text-gray-500 hover:text-accent hover:underline disabled:opacity-40 disabled:hover:no-underline'
                            title='Report this comment'
                          >
                            {reportedSet.has(String(c.id)) ? 'Reported' : 'Report'}
                          </button>
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
      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onReported={() =>
            setReportedSet((prev) => new Set(prev).add(reportTarget.id))
          }
        />
      )}
      <Footer />
    </div>
  )
}

export default ProjectDetailClient
