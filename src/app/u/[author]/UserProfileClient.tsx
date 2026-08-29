'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { likeProject } from '@/store/redux/projectsSlice'
import { addBookmark, fetchBookmarks, removeBookmark } from '@/store/redux/bookmarksSlice'
import { fetchLikedProjects, syncLike, selectLikedProjectIds } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import EmptyState from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/buttonClass'
import type { ClientProject } from '@/lib/shapes'
import { showToast } from '@/store/redux/toastSlice'

interface UserProfileClientProps {
  author: string
  initialProjects: ClientProject[]
}

const UserProfileClient = ({ author, initialProjects }: UserProfileClientProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [userProjects, setUserProjects] = useState<ClientProject[]>(initialProjects)

  const { currentUser } = useAppSelector((state) => state.auth)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)
  const bookmarks = useAppSelector((state) => state.bookmarks.items)

  const decodedAuthor = decodeURIComponent(author)

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchLikedProjects(String(currentUser.id)))
      dispatch(fetchBookmarks(String(currentUser.id)))
    }
  }, [currentUser?.id, dispatch])

  const totalLikes = userProjects.reduce(
    (sum, p) => sum + (p.likes || 0),
    0,
  )
  const isOwnProfile =
    currentUser?.name === decodedAuthor ||
    String(currentUser?.username ?? '') === decodedAuthor

  const handleLike = async (id: string) => {
    const userId = currentUser?.id
    if (!userId) {
      router.push('/login')
      return
    }
    const result = await dispatch(likeProject({ id, userId: String(userId) }))
    if (!likeProject.fulfilled.match(result)) return
    setUserProjects((prev) =>
      prev.map((p) =>
        String(p.id) === id
          ? { ...p, likes: result.payload.likes }
          : p,
      ),
    )
    const likedProject = userProjects.find((p) => String(p.id) === id)
    if (likedProject) {
      dispatch(syncLike({ project: likedProject, liked: result.payload.liked, likes: result.payload.likes, userId: String(userId) }))
    }
  }

  const handleBookmark = async (id: string) => {
    if (!currentUser) return
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
          <EmptyState
            title='No projects yet.'
            action={
              isOwnProfile ? (
                <Link
                  href='/dashboard/new'
                  className={buttonClass('primary', 'md', 'inline-block')}
                >
                  Create your first project
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {userProjects.map((project) => (
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
        )}
      </main>
      <Footer />
    </div>
  )
}

export default UserProfileClient
