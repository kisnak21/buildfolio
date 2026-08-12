'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { useRouter } from 'next/navigation'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchLikedProjects, syncLike } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { HeartIcon } from '@heroicons/react/24/solid'

const LikedClient = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const { items: likedProjects, loading } = useAppSelector(
    (state) => state.likes,
  )
  const allProjects = useAppSelector((state) => state.projects.items)
  const likedProjectIds = useAppSelector((state) =>
    state.likes.items.map((i) => String(i.id)),
  )

  useEffect(() => {
    if (allProjects.length === 0) {
      dispatch(fetchProjects() as any)
    }
    dispatch(fetchLikedProjects() as any)
  }, [dispatch, allProjects.length])

  const handleLike = async (id: string, currentLikes: number) => {
    const result = await dispatch(likeProject(id) as any)
    if (likeProject.fulfilled.match(result)) {
      dispatch(
        syncLike({
          project: allProjects.find((p: any) => p.id === id) as any,
          liked: result.payload.liked,
        }),
      )
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
          <div className='bg-white border-4 border-dark rounded-2xl p-12 text-center shadow-brutal'>
            <p className='text-lg font-bold text-gray-600 mb-6'>
              No liked projects yet.
            </p>
            <button
              onClick={() => router.push('/projects')}
              className='btn-brutal bg-primary text-dark border-2 border-dark px-6 py-3 rounded-xl font-bold shadow-brutal-sm hover:bg-pink-400'
            >
              Explore projects
            </button>
          </div>
        ) : (
          <>
            <p className='text-sm font-bold text-gray-600 mb-6'>
              {likedProjects.length} liked
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {likedProjects.map((project: any) => (
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

export default LikedClient
