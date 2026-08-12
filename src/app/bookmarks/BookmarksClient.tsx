'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { useRouter } from 'next/navigation'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchBookmarks } from '@/store/redux/bookmarksSlice'
import { fetchLikedProjects, syncLike } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'

const BookmarksClient = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const { items: bookmarks, loading } = useAppSelector(
    (state) => state.bookmarks,
  )
  const allProjects = useAppSelector((state) => state.projects.items)
  const currentUser = useAppSelector((state) => state.auth.currentUser)
  const likedProjectIds = useAppSelector((state) => state.likes.items.map((i) => String(i.id)))

  useEffect(() => {
    if (allProjects.length === 0) {
      dispatch(fetchProjects() as any)
    }
    if (currentUser?.id) {
      dispatch(fetchBookmarks(currentUser.id) as any)
      dispatch(fetchLikedProjects() as any)
    }
  }, [dispatch, allProjects.length, currentUser?.id])

  const bookmarkedProjectIds = bookmarks.map((b: any) => b.project_id)
  const bookmarkedProjects = allProjects.filter((p: any) =>
    bookmarkedProjectIds.includes(p.id),
  )

  const handleLike = async (id: string) => {
    const result = await dispatch(likeProject(id) as any)
    if (likeProject.fulfilled.match(result)) {
      dispatch(syncLike({ project: allProjects.find((p: any) => p.id === id) as any, liked: result.payload.liked }))
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

        {!loading && bookmarkedProjects.length === 0 && (
          <div className='bg-white border-4 border-dark rounded-2xl p-12 text-center shadow-brutal'>
            <p className='text-lg font-bold text-gray-600 mb-6'>No bookmarks yet.</p>
            <button
              onClick={() => router.push('/projects')}
              className='btn-brutal bg-primary text-dark border-2 border-dark px-6 py-3 rounded-xl font-bold shadow-brutal-sm hover:bg-pink-400'
            >
              Explore projects
            </button>
          </div>
        )}

        {!loading && bookmarkedProjects.length > 0 && (
          <>
            <p className='text-sm font-bold text-gray-600 mb-6'>
              {bookmarkedProjects.length} saved
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {bookmarkedProjects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
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
