'use client'

import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchBookmarks } from '@/store/redux/bookmarksSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'

const BookmarksClient = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  const { items: bookmarks, loading } = useSelector(
    (state: any) => state.bookmarks,
  )
  const allProjects = useSelector((state: any) => state.projects.items)
  const currentUser = useSelector((state: any) => state.auth.currentUser)

  useEffect(() => {
    if (allProjects.length === 0) {
      dispatch(fetchProjects() as any)
    }
    if (currentUser?.id) {
      dispatch(fetchBookmarks(currentUser.id) as any)
    }
  }, [dispatch, allProjects.length, currentUser?.id])

  const bookmarkedProjectIds = bookmarks.map((b: any) => b.project_id)
  const bookmarkedProjects = allProjects.filter((p: any) =>
    bookmarkedProjectIds.includes(p.id),
  )

  const handleLike = (id: string) => {
    dispatch(likeProject(id) as any)
  }

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8'>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>Bookmarks</h1>
          <p className='text-sm text-gray-500'>Projects you&apos;ve saved</p>
        </div>

        {loading && <p className='text-sm text-gray-400'>Loading bookmarks...</p>}

        {!loading && bookmarkedProjects.length === 0 && (
          <div className='bg-white border border-gray-200 rounded-xl p-12 text-center'>
            <p className='text-sm text-gray-400 mb-3'>No bookmarks yet.</p>
            <button
              onClick={() => router.push('/')}
              className='text-sm text-primary hover:text-primary-hover transition-colors'
            >
              Explore projects →
            </button>
          </div>
        )}

        {!loading && bookmarkedProjects.length > 0 && (
          <>
            <p className='text-sm text-gray-400 mb-4'>
              {bookmarkedProjects.length} saved
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {bookmarkedProjects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
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
