'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import EmptyState from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/buttonClass'
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks'
import {
  fetchBookmarks,
  removeBookmark,
} from '@/store/redux/bookmarksSlice'
import {
  fetchLikedProjects,
  selectLikedProjectIds,
  syncLike,
} from '@/store/redux/likesSlice'
import { likeProject } from '@/store/redux/projectsSlice'

const BookmarksClient = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { items: bookmarks, loading, error } = useAppSelector(
    (state) => state.bookmarks,
  )
  const currentUser = useAppSelector((state) => state.auth.currentUser)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser?.id) return
    dispatch(fetchBookmarks())
    dispatch(fetchLikedProjects())
  }, [dispatch, currentUser?.id])

  const handleLike = async (id: string) => {
    const bookmark = bookmarks.find(
      (entry) => entry.project_id === String(id),
    )
    if (!bookmark) return
    const result = await dispatch(likeProject(id))
    if (likeProject.fulfilled.match(result)) {
      dispatch(
        syncLike({ project: bookmark.project, liked: result.payload.liked }),
      )
    }
  }

  const handleRemove = async (projectId: string) => {
    const bookmark = bookmarks.find(
      (entry) => entry.project_id === projectId,
    )
    if (!bookmark) return
    setRemovingId(bookmark.id)
    await dispatch(removeBookmark({ bookmarkId: bookmark.id }))
    setRemovingId(null)
  }

  return (
    <div className='flex min-h-screen flex-col bg-bgMain text-dark'>
      <Header />
      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-12'>
        <div className='mb-8 border-b-4 border-dark pb-6'>
          <h1 className='mb-2 text-4xl font-black'>Bookmarks</h1>
          <p className='text-lg font-bold text-gray-600'>
            Projects you have saved for later.
          </p>
        </div>

        {loading && (
          <p className='text-sm font-bold text-gray-600'>
            Loading saved projects...
          </p>
        )}

        {!loading && error && (
          <div role='alert' className='rounded-xl border-2 border-dark bg-white p-5'>
            <p className='font-bold text-red-700'>{error}</p>
            <button
              type='button'
              onClick={() => dispatch(fetchBookmarks())}
              className={buttonClass('secondary', 'md', 'mt-4')}
            >
              Retry bookmarks
            </button>
          </div>
        )}

        {!loading && !error && bookmarks.length === 0 && (
          <EmptyState
            title='No bookmarks yet.'
            action={
              <button
                type='button'
                onClick={() => router.push('/projects')}
                className={buttonClass()}
              >
                Browse projects
              </button>
            }
          />
        )}

        {!loading && !error && bookmarks.length > 0 && (
          <>
            <p className='mb-6 text-sm font-bold text-gray-600'>
              {bookmarks.length} saved
            </p>
            <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
              {bookmarks.map((bookmark) => (
                <ProjectCard
                  key={bookmark.id}
                  project={bookmark.project}
                  onLike={handleLike}
                  isLiked={likedProjectIds.includes(bookmark.project_id)}
                  isBookmarked
                  bookmarkPending={removingId === bookmark.id}
                  onBookmark={handleRemove}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default BookmarksClient
