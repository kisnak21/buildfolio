'use client'

import { useState, useEffect, useDeferredValue } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchLikedProjects, syncLike, selectLikedProjectIds } from '@/store/redux/likesSlice'
import { addBookmark, fetchBookmarks, removeBookmark } from '@/store/redux/bookmarksSlice'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

const PAGE_SIZE = 6
const SORT_OPTIONS = ['newest', 'likes', 'oldest', 'title'] as const

interface ProjectsClientProps {
  techCounts: { name: string; count: number }[]
  categories: { id: string; name: string; icon: string | null }[]
}

const ProjectsClient = ({ techCounts, categories }: ProjectsClientProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: projects, loading, error, pagination } = useAppSelector(
    (state) => state.projects,
  )

  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const deferredSearch = useDeferredValue(search)
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get('category') || '',
  )
  const [selectedTech, setSelectedTech] = useState(
    () => searchParams.get('technology') || '',
  )
  const [sortBy, setSortBy] = useState<string>(() => {
    const requested = searchParams.get('sort')
    return SORT_OPTIONS.find((option) => option === requested) || 'newest'
  })
  const currentUser = useAppSelector((state) => state.auth.currentUser)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)
  const bookmarks = useAppSelector((state) => state.bookmarks.items)

  const [page, setPage] = useState(() => {
    const parsed = Number(searchParams.get('page'))
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1
  })

  useEffect(() => {
    dispatch(
      fetchProjects({
        page,
        limit: PAGE_SIZE,
        search: deferredSearch.trim() || undefined,
        category: selectedCategory || undefined,
        technology: selectedTech || undefined,
        sort: sortBy,
      }),
    )
  }, [deferredSearch, dispatch, page, selectedCategory, selectedTech, sortBy])

  useEffect(() => {
    if (!currentUser?.id) return
    dispatch(fetchLikedProjects(String(currentUser.id)))
    dispatch(fetchBookmarks(String(currentUser.id)))
  }, [currentUser?.id, dispatch])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (deferredSearch.trim()) params.set('search', deferredSearch.trim())
    else params.delete('search')
    if (page === 1) params.delete('page')
    else params.set('page', String(page))
    const query = params.toString()
    window.history.replaceState(null, '', query ? `/projects?${query}` : '/projects')
  }, [deferredSearch, page])

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const requestedSort = params.get('sort')
      const parsedPage = Number(params.get('page'))

      setSearch(params.get('search') || '')
      setSelectedCategory(params.get('category') || '')
      setSelectedTech(params.get('technology') || '')
      setSortBy(SORT_OPTIONS.find((option) => option === requestedSort) || 'newest')
      setPage(Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1)
    }

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  const updateUrlFilter = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    const query = params.toString()
    window.history.replaceState(null, '', query ? `/projects?${query}` : '/projects')
  }

  const totalPages = pagination?.totalPages || 1
  const handleLike = async (id: string) => {
    const userId = currentUser?.id
    if (!userId) return
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

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8 border-b-4 border-dark pb-6'>
          <h1 className='text-4xl font-black mb-2'>
            All Projects
          </h1>
            <p className='font-bold text-gray-600 text-lg'>
            {pagination?.total || projects.length} projects on Buildfolio
          </p>
        </div>

        {/* Filters */}
        <div className='flex flex-col md:flex-row gap-4 mb-8 bg-accentSoft p-4 border-4 border-dark rounded-2xl shadow-brutal-sm'>
          <div className='flex-1 relative'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <MagnifyingGlassIcon className='w-6 h-6 text-dark' />
            </div>
            <input
              type='text'
              placeholder='Search projects...'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className='input-brutal w-full pl-12 pr-4 py-3 bg-white border-2 border-dark rounded-xl font-bold shadow-brutal-sm transition-shadow'
            />
          </div>
          
          <div className='flex flex-wrap gap-4'>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(1)
                updateUrlFilter('category', e.target.value)
              }}
              className='input-brutal flex-1 md:flex-none bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm appearance-none cursor-pointer'
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
              onChange={(e) => {
                setSelectedTech(e.target.value)
                setPage(1)
                updateUrlFilter('technology', e.target.value)
              }}
              className='input-brutal flex-1 md:flex-none bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm appearance-none cursor-pointer'
            >
              <option value=''>All Technologies</option>
              {techCounts.map((tech) => (
                <option key={tech.name} value={tech.name}>
                  {tech.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
                updateUrlFilter('sort', e.target.value)
              }}
              className='input-brutal flex-1 md:flex-none bg-secondary border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm appearance-none cursor-pointer'
            >
              <option value='newest'>Sort: Newest</option>
              <option value='likes'>Sort: Most Liked</option>
              <option value='oldest'>Sort: Oldest</option>
              <option value='title'>Sort: A–Z</option>
            </select>
            {(search || selectedCategory || selectedTech) && (
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('')
                  setSelectedTech('')
                  setPage(1)
                  const params = new URLSearchParams(window.location.search)
                  params.delete('search')
                  params.delete('category')
                  params.delete('technology')
                  params.delete('page')
                  const query = params.toString()
                  window.history.replaceState(null, '', query ? `/projects?${query}` : '/projects')
                }}
                className='btn-brutal bg-white border-2 border-dark px-5 py-3 rounded-xl font-bold shadow-brutal-sm'
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <p className='text-sm font-bold text-gray-600 mb-6'>
           {pagination?.total ?? projects.length} project{(pagination?.total ?? projects.length) !== 1 ? 's' : ''} found
        </p>

        {error && <p className='text-sm font-bold text-red-600'>{error}</p>}
        {!error && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            ) : projects.length === 0 ? (
              <div className='col-span-1 md:col-span-2 lg:col-span-3 bg-white border-4 border-dark rounded-2xl shadow-brutal p-12 text-center'>
                <p className='text-lg font-bold text-gray-600'>
                  No projects match your filters.
                </p>
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
                  onBookmark={currentUser ? handleBookmark : undefined}
                  isBookmarked={bookmarks.some((bookmark) => String(bookmark.project_id) === String(project.id))}
                  isLiked={likedProjectIds.includes(String(project.id))}
                />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!error && !loading && totalPages > 1 && (
          <div className='flex items-center justify-center gap-3 mt-12'>
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className='btn-brutal px-5 py-3 font-bold rounded-xl border-2 border-dark bg-white text-dark hover:bg-yellow-50 disabled:opacity-50 disabled:pointer-events-none shadow-brutal-sm'
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`btn-brutal w-12 h-12 flex items-center justify-center font-bold rounded-xl border-2 border-dark shadow-brutal-sm ${
                  p === page
                    ? 'bg-primary text-dark shadow-brutal-sm transform -translate-y-0.5'
                    : 'bg-white text-dark hover:bg-yellow-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className='btn-brutal px-5 py-3 font-bold rounded-xl border-2 border-dark bg-white text-dark hover:bg-yellow-50 disabled:opacity-50 disabled:pointer-events-none shadow-brutal-sm'
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default ProjectsClient
