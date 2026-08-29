'use client'

import { useState, useEffect, useDeferredValue } from 'react'
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
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { getCategoryIcon } from '@/lib/categoryIcons'

interface HomeClientProps {
  techCounts: { name: string; count: number }[]
  categories: { id: string; name: string; icon: string | null }[]
}

const HomeClient = ({ techCounts, categories }: HomeClientProps) => {
  const dispatch = useAppDispatch()
  const {
    items: projects,
    loading,
    error,
    pagination,
  } = useAppSelector((state) => state.projects)
  const { currentUser } = useAppSelector((state) => state.auth)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)
  const bookmarks = useAppSelector((state) => state.bookmarks.items)
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    dispatch(
      fetchProjects({
        sort: 'home',
        search: deferredSearch.trim() || undefined,
        category: selectedCategory || undefined,
        technology: selectedTech || undefined,
      }),
    )
  }, [deferredSearch, dispatch, selectedCategory, selectedTech])

  useEffect(() => {
    if (!currentUser?.id) return
    dispatch(fetchLikedProjects(String(currentUser.id)))
    dispatch(fetchBookmarks(String(currentUser.id)))
  }, [currentUser?.id, dispatch])

  const visibleProjects = projects

  const sortedByLikes = [...visibleProjects].sort((a, b) => b.likes - a.likes)
  const featuredProjects = [...visibleProjects]
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
      count: projects.filter((p) => p.category === cat.name).length,
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

        {/* Search + Filter */}
        <section className='py-8 bg-bgMain border-b-4 border-dark'>
          <div className='max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <MagnifyingGlassIcon className='w-6 h-6 text-dark' />
              </div>
              <input
                type='text'
                placeholder='Search projects...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='input-brutal w-full pl-12 pr-4 py-3 bg-white border-2 border-dark rounded-xl font-bold shadow-brutal-sm transition-shadow'
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className='input-brutal bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm appearance-none pr-10 cursor-pointer'
              >
                <option value=''>All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className='input-brutal bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm appearance-none pr-10 cursor-pointer'
              >
                <option value=''>All Technologies</option>
{techCounts.map((tech) => (
                <option key={tech.name} value={tech.name}>
                  {tech.name}
                </option>
              ))}
              </select>
            </div>

            {(search || selectedCategory || selectedTech) && (
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('')
                  setSelectedTech('')
                }}
                className='btn-brutal bg-white border-2 border-dark px-5 py-3 rounded-xl font-bold shadow-brutal-sm text-sm'
              >
                Clear filters
              </button>
            )}
          </div>
          {(search || selectedCategory || selectedTech) && (
            <div className='max-w-6xl mx-auto px-4 mt-3'>
              <p className='text-xs font-bold text-gray-600'>
                {pagination?.total ?? visibleProjects.length} project{(pagination?.total ?? visibleProjects.length) !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </section>

        {/* Featured Projects */}
        <Section
          id='projects'
          title='Featured Projects'
          subtitle='Handpicked by the community'
          viewAllHref='/projects'
        >
          {error && <p className='text-sm font-bold text-red-600'>{error}</p>}
          {!error && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                  ))
                : featuredProjects.map((project) => (
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
        </Section>

        {/* Categories */}
        <Section
          id='categories'
          title='Browse by Category'
          subtitle='Find projects that match your interests'
          className='bg-orangeSoft border-t-4 border-b-4 border-dark'
        >
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            {derivedCategories.map((category) => (
              <CategoryCard
                key={category.name}
                {...category}
                isSelected={selectedCategory === category.name}
                onClick={() => {
                  setSelectedCategory(
                    selectedCategory === category.name ? '' : category.name,
                  )
                  const el = document.getElementById('projects')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        </Section>

        {/* Technologies */}
        <Section
          id='technologies'
          title='Trending Technologies'
          subtitle='What developers are building with right now'
          className='bg-successSoft border-b-4 border-dark'
        >
          <div className='flex flex-wrap gap-4'>
            {techCounts.map((tech) => (
              <TechPill
                key={tech.name}
                {...tech}
                isSelected={selectedTech === tech.name}
                onClick={() => {
                  setSelectedTech(selectedTech === tech.name ? '' : tech.name)
                  const el = document.getElementById('projects')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        </Section>

        {/* Favorite Projects */}
        <Section
          id='favorites'
          title='Community Favorites'
          subtitle='Most liked projects this month'
        >
          {error && <p className='text-sm font-bold text-red-600'>{error}</p>}
          {!error && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                  ))
                : favoriteProjects.map((project) => (
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
        </Section>
      </main>

      <Footer />
    </div>
  )
}

export default HomeClient
