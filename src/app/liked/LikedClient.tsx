'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { useRouter } from 'next/navigation'
import { likeProject } from '@/store/redux/projectsSlice'
import { addBookmark, fetchBookmarks, removeBookmark } from '@/store/redux/bookmarksSlice'
import { fetchLikedProjects, syncLike, selectLikedProjectIds } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/buttonClass'
import { HeartIcon } from '@heroicons/react/24/solid'
import { showToast } from '@/store/redux/toastSlice'

const LikedClient = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const { items: likedProjects, loading } = useAppSelector(
    (state) => state.likes,
  )
  const likedProjectIds = useAppSelector(selectLikedProjectIds)
  const { currentUser } = useAppSelector((state) => state.auth)
  const bookmarks = useAppSelector((state) => state.bookmarks.items)

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchLikedProjects(String(currentUser.id)))
      dispatch(fetchBookmarks(String(currentUser.id)))
    }
  }, [dispatch, currentUser?.id])

  const handleLike = async (id: string) => {
    const userId = currentUser?.id
    if (!userId) {
      router.push('/login')
      return
    }
    const result = await dispatch(likeProject({ id, userId: String(userId) }))
    const likedProject = likedProjects.find((p) => p.id === id)
    if (likeProject.fulfilled.match(result) && likedProject) {
      dispatch(
        syncLike({
          project: likedProject,
          liked: result.payload.liked,
          likes: result.payload.likes,
          userId: String(userId),
        }),
      )
    }
  }

  const handleBookmark = async (id: string) => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    const existing = bookmarks.find((bookmark) => String(bookmark.project_id) === id)
    const result = existing
      ? await dispatch(
          removeBookmark({ bookmarkId: existing.id, userId: String(currentUser.id) }),
        )
      : await dispatch(addBookmark({ project_id: id, userId: String(currentUser.id) }))
    if (existing && removeBookmark.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Bookmark removed.', type: 'info' }))
    } else if (!existing && addBookmark.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Project bookmarked!', type: 'success' }))
    }
  }

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8 border-b-4 border-dark pb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-primary border-2 border-dark rounded-xl flex items-center justify-center shadow-brutal-sm'>
              <HeartIcon className='w-6 h-6 text-dark' />
            </div>
            <div>
              <h1 className='text-4xl font-black'>Liked Projects</h1>
              <p className='font-bold text-gray-600 text-lg'>
                Projects you&apos;ve liked
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : likedProjects.length === 0 ? (
          <EmptyState
            title='No liked projects yet.'
            action={
              <button
                onClick={() => router.push('/projects')}
                className={buttonClass()}
              >
                Explore projects
              </button>
            }
          />
        ) : (
          <>
            <p className='text-sm font-bold text-gray-600 mb-6'>
              {likedProjects.length} liked
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {likedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
                  onBookmark={currentUser ? handleBookmark : undefined}
                  isBookmarked={bookmarks.some((bookmark) => String(bookmark.project_id) === String(project.id))}
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

export default LikedClient
