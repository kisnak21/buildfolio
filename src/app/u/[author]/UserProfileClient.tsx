'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { likeProject } from '@/store/redux/projectsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'

const UserProfileClient = () => {
  const { author } = useParams<{ author: string }>()
  const dispatch = useDispatch()

  const allProjects = useSelector((state: any) => state.projects.items)
  const { currentUser } = useSelector((state: any) => state.auth)

  const decodedAuthor = decodeURIComponent(author)
  const userProjects = allProjects.filter(
    (p: any) => p.author === decodedAuthor,
  )
  const totalLikes = userProjects.reduce(
    (sum: number, p: any) => sum + (p.likes || 0),
    0,
  )
  const isOwnProfile = currentUser?.name === decodedAuthor

  const handleLike = (id: string, currentLikes: number) => {
    dispatch(likeProject({ id, currentLikes }) as any)
  }

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='bg-white border border-gray-200 rounded-xl p-6 mb-8'>
          <div className='flex items-start gap-5'>
            <img
              src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${decodedAuthor}`}
              alt={decodedAuthor}
              className='w-16 h-16 rounded-full border border-gray-200'
            />
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-1'>
                <h1 className='text-xl font-semibold text-gray-900'>
                  {decodedAuthor}
                </h1>
                {isOwnProfile && (
                  <span className='text-xs bg-blue-50 text-primary border border-blue-100 px-2 py-0.5 rounded-md font-medium'>
                    You
                  </span>
                )}
              </div>
              <p className='text-sm text-gray-500 mb-4'>
                {isOwnProfile && currentUser?.bio
                  ? currentUser.bio
                  : 'Developer on Buildfolio'}
              </p>
              <div className='flex items-center gap-6'>
                <div className='text-center'>
                  <p className='text-lg font-semibold text-gray-900'>
                    {userProjects.length}
                  </p>
                  <p className='text-xs text-gray-500'>Projects</p>
                </div>
                <div className='w-px h-8 bg-gray-200' />
                <div className='text-center'>
                  <p className='text-lg font-semibold text-gray-900'>
                    {totalLikes}
                  </p>
                  <p className='text-xs text-gray-500'>Likes received</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-base font-semibold text-gray-900'>
            Projects by {decodedAuthor}
          </h2>
          <span className='text-sm text-gray-400'>
            {userProjects.length} total
          </span>
        </div>

        {userProjects.length === 0 ? (
          <div className='bg-white border border-gray-200 rounded-xl p-10 text-center'>
            <p className='text-sm text-gray-400'>No projects yet.</p>
            {isOwnProfile && (
              <Link
                href='/projects/new'
                className='mt-3 inline-block text-sm text-primary hover:text-primary-hover transition-colors'
              >
                Create your first project →
              </Link>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {userProjects.map((project: any) => (
              <ProjectCard
                key={project.id}
                project={project}
                onLike={handleLike}
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
