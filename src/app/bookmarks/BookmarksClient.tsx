'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { useRouter } from 'next/navigation'
import { likeProject } from '@/store/redux/projectsSlice'
import { fetchBookmarks, removeBookmark } from '@/store/redux/bookmarksSlice'
import { fetchLikedProjects, syncLike, selectLikedProjectIds } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import EmptyState from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/buttonClass'
import { showToast } from '@/store/redux/toastSlice'

const BookmarksClient = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const { items: bookmarks, loading, error } = useAppSelector(
    (state) => state.bookmarks,
  )
  const currentUser = useAppSelector((state) => state.auth.currentUser)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchBookmarks(String(currentUser.id)))
      dispatch(fetchLikedProjects(String(currentUser.id)))
    }
  }, [dispatch, currentUser?.id])

  const bookmarkedProjects = bookmarks.map((bookmark) => bookmark.project)

  const handleLike = async (id: string) => {
    const userId = currentUser?.id
    if (!userId) {
      router.push('/login')
      return
    }
    const result = await dispatch(likeProject({ id, userId: String(userId) }))
    const likedProject = bookmarkedProjects.find((p) => p.id === id)
    if (likeProject.fulfilled.match(result) && likedProject) {
      dispatch(syncLike({ project: likedProject, liked: result.payload.liked, likes: result.payload.likes, userId: String(userId) }))
    }
  }

  const handleBookmark = async (id: string) => {
    const userId = currentUser?.id
    const bookmark = bookmarks.find((item) => String(item.project_id) === id)
    if (!bookmark || !userId) return
    const result = await dispatch(
      removeBookmark({ bookmarkId: bookmark.id, userId: String(userId) }),
    )
    if (removeBookmark.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Bookmark removed.', type: 'info' }))
    }
  }

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8 border-b-4 border-dark pb-6'>
          <h1 className='text-4xl font-black mb-2'>Bookmarks</h1>
          <p className='font-bold text-gray-600 text-lg'>Projects you&apos;ve saved</p>
        </div>

        {loading && <p className='text-sm font-bold text-gray-600'>Loading bookmarks...</p>}

        {error && !loading && (
          <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal'>
            <p className='font-bold'>{error}</p>
            <button
              type='button'
               onClick={() => currentUser?.id && dispatch(fetchBookmarks(String(currentUser.id)))}
              className={`${buttonClass('primary', 'sm')} mt-4 min-h-11`}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && bookmarkedProjects.length === 0 && (
          <EmptyState
            title='No bookmarks yet.'
            action={
              <button
                onClick={() => router.push('/projects')}
                className={buttonClass()}
              >
                Explore projects
              </button>
            }
          />
        )}

        {!loading && !error && bookmarkedProjects.length > 0 && (
          <>
            <p className='text-sm font-bold text-gray-600 mb-6'>
              {bookmarkedProjects.length} saved
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {bookmarkedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                   onLike={handleLike}
                   onBookmark={handleBookmark}
                   isBookmarked
                   isLiked={likedProjectIds.includes(String(project.id))}
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
