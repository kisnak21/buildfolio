'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchLikedProjects, syncLike } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'

const UserProfileClient = () => {
  const { author } = useParams<{ author: string }>()
  const dispatch = useAppDispatch()

  const allProjects = useAppSelector((state) => state.projects.items)
  const { currentUser } = useAppSelector((state) => state.auth)
  const likedProjectIds = useAppSelector((state) => state.likes.items.map((i) => String(i.id)))

  const decodedAuthor = decodeURIComponent(author)

  useEffect(() => {
    if (allProjects.length === 0) {
      dispatch(fetchProjects() as any)
    }
    if (currentUser?.id) dispatch(fetchLikedProjects() as any)
  }, [dispatch, allProjects.length, currentUser?.id])

  const userProjects = allProjects.filter(
    (p: any) => p.author === decodedAuthor,
  )
  const totalLikes = userProjects.reduce(
    (sum: number, p: any) => sum + (p.likes || 0),
    0,
  )
  const isOwnProfile = currentUser?.name === decodedAuthor

  const handleLike = async (id: string, currentLikes: number) => {
    const result = await dispatch(likeProject(id) as any)
    if (likeProject.fulfilled.match(result)) {
      dispatch(syncLike({ project: allProjects.find((p: any) => p.id === id) as any, liked: result.payload.liked }))
    }
  }

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='bg-white border-4 border-dark rounded-2xl p-8 mb-12 shadow-brutal'>
          <div className='flex items-start gap-6 flex-col md:flex-row'>
            <Image
              src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${decodedAuthor}`}
              alt={decodedAuthor}
              width={96}
              height={96}
              unoptimized
              className='w-24 h-24 rounded-full border-4 border-dark bg-yellow-100 shadow-brutal-sm'
            />
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-3xl font-black text-dark'>
                  {decodedAuthor}
                </h1>
                {isOwnProfile && (
                  <span className='text-sm bg-primary border-2 border-dark px-3 py-1 rounded-md font-bold shadow-brutal-sm text-dark'>
                    You
                  </span>
                )}
              </div>
              <p className='text-lg font-medium text-gray-700 mb-6'>
                {isOwnProfile && currentUser?.bio
                  ? currentUser.bio
                  : 'Developer on Buildfolio'}
              </p>
              <div className='flex items-center gap-8'>
                <div className='text-center bg-gray-50 border-2 border-dark px-6 py-3 rounded-xl shadow-brutal-sm'>
                  <p className='text-2xl font-black text-dark'>
                    {userProjects.length}
                  </p>
                  <p className='text-sm font-bold text-gray-600'>Projects</p>
                </div>
                <div className='text-center bg-gray-50 border-2 border-dark px-6 py-3 rounded-xl shadow-brutal-sm'>
                  <p className='text-2xl font-black text-dark'>
                    {totalLikes}
                  </p>
                  <p className='text-sm font-bold text-gray-600'>Likes received</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6 flex items-center justify-between border-b-4 border-dark pb-4'>
          <h2 className='text-2xl font-black text-dark'>
            Projects by {decodedAuthor}
          </h2>
          <span className='font-bold text-gray-600 text-lg'>
            {userProjects.length} total
          </span>
        </div>

        {userProjects.length === 0 ? (
          <div className='bg-white border-4 border-dark rounded-2xl p-12 text-center shadow-brutal'>
            <p className='text-lg font-bold text-gray-600 mb-4'>No projects yet.</p>
            {isOwnProfile && (
              <Link
                href='/dashboard/new'
                className='btn-brutal inline-block bg-primary text-dark border-2 border-dark px-6 py-3 rounded-xl font-bold shadow-brutal-sm hover:bg-pink-400'
              >
                Create your first project
              </Link>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {userProjects.map((project: any) => (
              <ProjectCard
                key={project.id}
                project={project}
                onLike={handleLike}
                isLiked={likedProjectIds.includes(String(project.id))}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default UserProfileClient
