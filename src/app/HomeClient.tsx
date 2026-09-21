'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchLikedProjects, syncLike, selectLikedProjectIds } from '@/store/redux/likesSlice'
import { addBookmark, fetchBookmarks, removeBookmark } from '@/store/redux/bookmarksSlice'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import Section from '@/components/home/Section'
import ProjectCard from '@/components/home/ProjectCard'
import CategoryCard from '@/components/home/CategoryCard'
import TechPill from '@/components/home/TechPill'
import ProjectGridSkeleton from '@/components/ui/ProjectGridSkeleton'
import { getCategoryIcon } from '@/lib/categoryIcons'

interface HomeClientProps {
  techCounts: { name: string; count: number }[]
  categories: { id: string; name: string; icon: string | null; count: number }[]
}

type BrowseMode = 'categories' | 'technologies'
type ProjectFilter = 'category' | 'technology'

const getProjectsHref = (
  browse: BrowseMode,
  filter: ProjectFilter,
  value: string,
) => {
  const query = new URLSearchParams({ browse, [filter]: value })
  return `/projects?${query.toString()}`
}

const HomeClient = ({ techCounts, categories }: HomeClientProps) => {
  const dispatch = useAppDispatch()
  const {
    items: projects,
    loading,
    error,
  } = useAppSelector((state) => state.projects)
  const { currentUser } = useAppSelector((state) => state.auth)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)
  const bookmarks = useAppSelector((state) => state.bookmarks.items)
  const router = useRouter()

  useEffect(() => {
    dispatch(fetchProjects({ sort: 'home' }))
  }, [dispatch])

  useEffect(() => {
    if (!currentUser?.id) return
    dispatch(fetchLikedProjects(String(currentUser.id)))
    dispatch(fetchBookmarks(String(currentUser.id)))
  }, [currentUser?.id, dispatch])

  const sortedByLikes = [...projects].sort((a, b) => b.likes - a.likes)
  const featuredProjects = [...projects]
    .sort((a, b) => {
      if (a.featuredAt && b.featuredAt) {
        return Date.parse(b.featuredAt) - Date.parse(a.featuredAt)
      }
      if (a.featuredAt) return -1
      if (b.featuredAt) return 1
      return b.likes - a.likes
    })
    .slice(0, 3)
  const featuredIds = new Set(featuredProjects.map((project) => project.id))
  const favoriteProjects = sortedByLikes
    .filter(
      (project) => !project.featuredAt && !featuredIds.has(project.id),
    )
    .slice(0, 3)

  const derivedCategories = categories.map((cat) => {
    const Icon = getCategoryIcon(cat.icon, cat.name)
    return {
      icon: <Icon />,
      name: cat.name,
      count: cat.count,
    }
  })

  const handleLike = async (id: string) => {
    const userId = currentUser?.id
    if (!userId) {
      window.location.href = '/login'
      return
    }
    const result = await dispatch(likeProject({ id, userId: String(userId) }))
    const likedProject = projects.find((p) => p.id === id)
    if (likeProject.fulfilled.match(result) && likedProject) {
      dispatch(syncLike({ project: likedProject, liked: result.payload.liked, likes: result.payload.likes, userId: String(userId) }))
    }
  }

  const handleBookmark = async (id: string) => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    const existing = bookmarks.find((bookmark) => String(bookmark.project_id) === id)
    if (existing) {
      const result = await dispatch(
        removeBookmark({ bookmarkId: existing.id, userId: String(currentUser.id) }),
      )
      if (removeBookmark.fulfilled.match(result)) {
        dispatch(showToast({ message: 'Bookmark removed.', type: 'info' }))
      }
      return
    }

    const result = await dispatch(
      addBookmark({ project_id: id, userId: String(currentUser.id) }),
    )
    if (addBookmark.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Project bookmarked!', type: 'success' }))
    }
  }

  return (
    <div className='bg-bgMain text-dark flex-1 flex flex-col'>
      <Header />

      <main className='flex-1'>
        <Hero currentUser={currentUser} />

        {/* Featured Projects */}
        <Section
          id='projects'
          title='Featured Projects'
          subtitle='Handpicked by the community'
          viewAllHref='/projects'
          viewAllLabel='Browse all projects'
        >
          {error && <p className='text-sm font-bold text-red-600'>{error}</p>}
          {!error && loading && (
            <ProjectGridSkeleton
              showBookmark={Boolean(currentUser)}
              label='Loading featured projects'
            />
          )}
          {!error && !loading && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {featuredProjects.length === 0 ? (
                <p className='col-span-full rounded-xl border-2 border-dark bg-white p-8 text-center font-bold'>
                  No projects have been published yet.
                </p>
              ) : (
                featuredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLike={handleLike}
                    onBookmark={currentUser ? handleBookmark : undefined}
                    isBookmarked={bookmarks.some(
                      (bookmark) =>
                        String(bookmark.project_id) === String(project.id),
                    )}
                    isLiked={likedProjectIds.includes(String(project.id))}
                  />
                ))
              )}
            </div>
          )}
        </Section>

        {/* Categories */}
        <Section
          id='categories'
          title='Browse by Category'
          subtitle='Find projects that match your interests'
          viewAllHref='/projects?browse=categories'
          viewAllLabel='Browse all categories'
          className='bg-orangeSoft border-t-4 border-b-4 border-dark'
        >
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            {derivedCategories.length === 0 ? (
              <p className='col-span-full rounded-xl border-2 border-dark bg-white p-6 text-center font-bold'>
                No categories are available yet.
              </p>
            ) : (
              derivedCategories.map((category) => (
                <CategoryCard
                  key={category.name}
                  {...category}
                  href={getProjectsHref(
                    'categories',
                    'category',
                    category.name,
                  )}
                />
              ))
            )}
          </div>
        </Section>

        {/* Technologies */}
        <Section
          id='technologies'
          title='Trending Technologies'
          subtitle='What developers are building with right now'
          viewAllHref='/projects?browse=technologies'
          viewAllLabel='See trending technologies'
          className='bg-successSoft border-b-4 border-dark'
        >
          <div className='flex flex-wrap gap-4'>
            {techCounts.length === 0 ? (
              <p className='w-full rounded-xl border-2 border-dark bg-white p-6 text-center font-bold'>
                No technologies are in use yet.
              </p>
            ) : (
              techCounts.map((tech) => (
                <TechPill
                  key={tech.name}
                  {...tech}
                  href={getProjectsHref(
                    'technologies',
                    'technology',
                    tech.name,
                  )}
                />
              ))
            )}
          </div>
        </Section>

        {/* Favorite Projects */}
        <Section
          id='favorites'
          title='Community Favorites'
          subtitle='Projects the community has liked most'
        >
          {error && <p className='text-sm font-bold text-red-600'>{error}</p>}
          {!error && loading && (
            <ProjectGridSkeleton
              showBookmark={Boolean(currentUser)}
              label='Loading community favorites'
            />
          )}
          {!error && !loading && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {favoriteProjects.length === 0 ? (
                <p className='col-span-full rounded-xl border-2 border-dark bg-white p-8 text-center font-bold'>
                  No community favorites yet.
                </p>
              ) : (
                favoriteProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLike={handleLike}
                    onBookmark={currentUser ? handleBookmark : undefined}
                    isBookmarked={bookmarks.some(
                      (bookmark) =>
                        String(bookmark.project_id) === String(project.id),
                    )}
                    isLiked={likedProjectIds.includes(String(project.id))}
                  />
                ))
              )}
            </div>
          )}
        </Section>
      </main>

      <Footer />
    </div>
  )
}

export default HomeClient
