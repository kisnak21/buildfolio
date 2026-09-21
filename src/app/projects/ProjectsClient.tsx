'use client'

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import CategoryCard from '@/components/home/CategoryCard'
import TechPill from '@/components/home/TechPill'
import ProjectGridSkeleton from '@/components/ui/ProjectGridSkeleton'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import {
  fetchLikedProjects,
  selectLikedProjectIds,
  syncLike,
} from '@/store/redux/likesSlice'
import {
  addBookmark,
  fetchBookmarks,
  removeBookmark,
  selectBookmarkedProjectIds,
} from '@/store/redux/bookmarksSlice'

const PAGE_SIZE = 6
const SORT_OPTIONS = ['newest', 'likes', 'oldest', 'title'] as const
const BROWSE_MODES = ['categories', 'technologies'] as const

type BrowseMode = (typeof BROWSE_MODES)[number]
type DirectoryView = BrowseMode | 'explore'
type ProjectFilter = 'category' | 'technology'

const DIRECTORY_COPY: Record<
  DirectoryView,
  { title: string; description: string }
> = {
  explore: {
    title: 'Explore Projects',
    description: 'Search and filter every published project.',
  },
  categories: {
    title: 'Browse Categories',
    description: 'Choose a category, then browse every matching project.',
  },
  technologies: {
    title: 'Trending Technologies',
    description: 'See what developers are building with, then browse the projects.',
  },
}

interface ProjectsClientProps {
  techCounts: { name: string; count: number }[]
  categories: { id: string; name: string; icon: string | null; count: number }[]
}

const positivePage = (value: string | null): number => {
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const buildQueryHref = (
  pathname: string,
  queryString: string,
  updates: Record<string, string | null>,
): string => {
  const next = new URLSearchParams(queryString)
  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  const nextQuery = next.toString()
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}`
}

const ProjectsClient = ({ techCounts, categories }: ProjectsClientProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { items: projects, loading, error, pagination } = useAppSelector(
    (state) => state.projects,
  )
  const currentUser = useAppSelector((state) => state.auth.currentUser)
  const bookmarks = useAppSelector((state) => state.bookmarks.items)
  const bookmarkedProjectIds = useAppSelector(selectBookmarkedProjectIds)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)
  const [bookmarkPendingId, setBookmarkPendingId] = useState<string | null>(null)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const deferredSearch = useDeferredValue(search.trim())
  const queryString = searchParams.toString()
  const serverSearch = searchParams.get('search') || ''
  const selectedCategory = searchParams.get('category') || ''
  const selectedTech = searchParams.get('technology') || ''
  const requestedBrowse = searchParams.get('browse')
  const browseMode = BROWSE_MODES.find((mode) => mode === requestedBrowse)
  const directoryView: DirectoryView = browseMode ?? 'explore'
  const directoryCopy = DIRECTORY_COPY[directoryView]
  const requestedSort = searchParams.get('sort')
  const sortBy = SORT_OPTIONS.find((option) => option === requestedSort) || 'newest'
  const page = positivePage(searchParams.get('page'))
  const isUpdatingResults = isPending || loading

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => {
        router.replace(buildQueryHref(pathname, queryString, updates), {
          scroll: false,
        })
      })
    },
    [pathname, queryString, router, startTransition],
  )

  useEffect(() => {
    if (serverSearch === deferredSearch) return
    updateQuery({ search: deferredSearch || null, page: null })
  }, [deferredSearch, serverSearch, updateQuery])

  useEffect(() => {
    dispatch(
      fetchProjects({
        page,
        limit: PAGE_SIZE,
        search: serverSearch || undefined,
        category: selectedCategory || undefined,
        technology: selectedTech || undefined,
        sort: sortBy,
      }),
    )
  }, [dispatch, page, selectedCategory, selectedTech, serverSearch, sortBy])

  useEffect(() => {
    if (!currentUser?.id) return
    dispatch(fetchLikedProjects(String(currentUser.id)))
    dispatch(fetchBookmarks(String(currentUser.id)))
  }, [dispatch, currentUser?.id])

  const handleLike = async (id: string) => {
    if (!currentUser) return router.push('/login')
    const userId = String(currentUser.id)
    const result = await dispatch(likeProject({ id, userId }))
    const likedProject = projects.find((project) => String(project.id) === id)
    if (likeProject.fulfilled.match(result) && likedProject) {
      dispatch(
        syncLike({
          project: likedProject,
          liked: result.payload.liked,
          likes: result.payload.likes,
          userId,
        }),
      )
    }
  }

  const handleBookmark = async (id: string) => {
    if (!currentUser) return router.push('/login')
    const userId = String(currentUser.id)
    setBookmarkPendingId(id)
    const existing = bookmarks.find(
      (bookmark) => bookmark.project_id === id,
    )
    if (existing) {
      await dispatch(removeBookmark({ bookmarkId: existing.id, userId }))
    } else {
      await dispatch(addBookmark({ project_id: id, userId }))
    }
    setBookmarkPendingId(null)
  }

  const totalPages = Math.max(pagination.totalPages, 1)
  const activeSelection = selectedCategory || selectedTech
  const clearFilters = () => {
    setSearch('')
    updateQuery({
      search: null,
      category: null,
      technology: null,
      sort: null,
      page: null,
    })
  }

  const getBrowseHref = (
    mode: BrowseMode,
    filter: ProjectFilter,
    value: string,
  ): string =>
    buildQueryHref(pathname, queryString, {
      browse: mode,
      [filter]: value,
      page: null,
    })

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    updateQuery({ page: nextPage === 1 ? null : String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className='flex min-h-screen flex-col bg-bgMain text-dark'>
      <Header
        activeSection={
          browseMode === 'categories'
            ? 'categories'
            : browseMode === 'technologies'
              ? 'trending'
              : 'explore'
        }
      />
      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-12'>
        <div className='mb-8 border-b-4 border-dark pb-6'>
          <h1 className='mb-2 text-4xl font-black'>{directoryCopy.title}</h1>
          <p className='max-w-2xl text-lg font-bold text-gray-700'>
            {directoryCopy.description}
          </p>
          <p aria-live='polite' className='mt-3 text-sm font-bold text-gray-600'>
            {isUpdatingResults ? (
              <span className='inline-flex items-center gap-2 rounded-lg border-2 border-dark bg-secondary px-3 py-1.5 text-dark'>
                <ArrowPathIcon className='h-4 w-4 animate-spin' aria-hidden='true' />
                {isPending ? 'Updating project results…' : 'Loading projects…'}
              </span>
            ) : (
              `${pagination.total} projects found`
            )}
          </p>
        </div>

        {browseMode === 'categories' && (
          <section
            aria-labelledby='category-browse-heading'
            className='mb-8 rounded-2xl border-4 border-dark bg-orangeSoft p-5 shadow-brutal-sm md:p-6'
          >
            <div className='mb-6'>
              <h2 id='category-browse-heading' className='text-2xl font-black'>
                Choose a category
              </h2>
              <p className='mt-1 font-bold text-gray-700'>
                Each category opens the full set of matching projects.
              </p>
            </div>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
              {categories.length === 0 ? (
                <p className='col-span-full rounded-xl border-2 border-dark bg-white p-6 text-center font-bold'>
                  No categories are available yet.
                </p>
              ) : (
                categories.map((category) => {
                  const Icon = getCategoryIcon(category.icon, category.name)
                  return (
                    <CategoryCard
                      key={category.id}
                      icon={<Icon />}
                      name={category.name}
                      count={category.count}
                      href={getBrowseHref(
                        'categories',
                        'category',
                        category.name,
                      )}
                      isSelected={selectedCategory === category.name}
                    />
                  )
                })
              )}
            </div>
          </section>
        )}

        {browseMode === 'technologies' && (
          <section
            aria-labelledby='technology-browse-heading'
            className='mb-8 rounded-2xl border-4 border-dark bg-successSoft p-5 shadow-brutal-sm md:p-6'
          >
            <div className='mb-6'>
              <h2 id='technology-browse-heading' className='text-2xl font-black'>
                Choose a technology
              </h2>
              <p className='mt-1 font-bold text-gray-700'>
                Technologies are ordered by how many published projects use them.
              </p>
            </div>
            <div className='flex flex-wrap gap-3'>
              {techCounts.length === 0 ? (
                <p className='w-full rounded-xl border-2 border-dark bg-white p-6 text-center font-bold'>
                  No technologies are in use yet.
                </p>
              ) : (
                techCounts.map((technology) => (
                  <TechPill
                    key={technology.name}
                    {...technology}
                    href={getBrowseHref(
                      'technologies',
                      'technology',
                      technology.name,
                    )}
                    isSelected={selectedTech === technology.name}
                  />
                ))
              )}
            </div>
          </section>
        )}

        <div
          aria-busy={isUpdatingResults}
          className='mb-8 rounded-2xl border-4 border-dark bg-accentSoft p-4 shadow-brutal-sm'
        >
          <div className='flex flex-col gap-4 md:flex-row'>
            <div className='relative flex-1'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                <MagnifyingGlassIcon className='h-6 w-6 text-dark' aria-hidden />
              </div>
              <label htmlFor='project-search' className='sr-only'>
                Search projects
              </label>
              <input
                id='project-search'
                type='search'
                placeholder='Search projects'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className='input-brutal w-full rounded-xl border-2 border-dark bg-white py-3 pl-12 pr-4 font-bold shadow-brutal-sm transition-shadow'
              />
            </div>

            <div className='flex flex-wrap gap-4'>
              {!browseMode && (
                <select
                  aria-label='Filter by category'
                  value={selectedCategory}
                  onChange={(event) =>
                    updateQuery({ category: event.target.value || null, page: null })
                  }
                  className='input-brutal min-h-11 flex-1 cursor-pointer appearance-none rounded-xl border-2 border-dark bg-white px-4 py-3 font-bold shadow-brutal-sm md:flex-none'
                >
                  <option value=''>All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {!browseMode && (
                <select
                  aria-label='Filter by technology'
                  value={selectedTech}
                  onChange={(event) =>
                    updateQuery({
                      technology: event.target.value || null,
                      page: null,
                    })
                  }
                  className='input-brutal min-h-11 flex-1 cursor-pointer appearance-none rounded-xl border-2 border-dark bg-white px-4 py-3 font-bold shadow-brutal-sm md:flex-none'
                >
                  <option value=''>All technologies</option>
                  {techCounts.map((technology) => (
                    <option key={technology.name} value={technology.name}>
                      {technology.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                aria-label='Sort projects'
                value={sortBy}
                onChange={(event) =>
                  updateQuery({
                    sort: event.target.value === 'newest' ? null : event.target.value,
                    page: null,
                  })
                }
                className='input-brutal min-h-11 flex-1 cursor-pointer appearance-none rounded-xl border-2 border-dark bg-secondary px-4 py-3 font-bold shadow-brutal-sm md:flex-none'
              >
                <option value='newest'>Newest</option>
                <option value='likes'>Most liked</option>
                <option value='oldest'>Oldest</option>
                <option value='title'>Title A-Z</option>
              </select>
              {(search || selectedCategory || selectedTech || sortBy !== 'newest') && (
                <button
                  type='button'
                  onClick={clearFilters}
                  className='btn-brutal min-h-11 rounded-xl border-2 border-dark bg-white px-5 py-3 font-bold shadow-brutal-sm'
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          {isUpdatingResults && (
            <div
              aria-hidden='true'
              className='mt-3 flex items-center gap-2 text-sm font-black text-dark'
            >
              <ArrowPathIcon className='h-4 w-4 animate-spin' />
              {isPending ? 'Updating projects…' : 'Loading projects…'}
            </div>
          )}
        </div>

        {error && (
          <div role='alert' className='rounded-xl border-2 border-dark bg-white p-5'>
            <p className='font-bold text-red-700'>{error}</p>
            <button
              type='button'
              onClick={() =>
                dispatch(
                  fetchProjects({
                    page,
                    limit: PAGE_SIZE,
                    search: serverSearch || undefined,
                    category: selectedCategory || undefined,
                    technology: selectedTech || undefined,
                    sort: sortBy,
                  }),
                )
              }
              className='mt-4 min-h-11 rounded-xl border-2 border-dark bg-white px-5 py-3 font-bold shadow-brutal-sm'
            >
              Retry projects
            </button>
          </div>
        )}

        {!error &&
          (loading ? (
            <ProjectGridSkeleton count={PAGE_SIZE} />
          ) : (
            <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
              {projects.length === 0 ? (
                <div className='col-span-1 rounded-2xl border-4 border-dark bg-white p-12 text-center shadow-brutal md:col-span-2 lg:col-span-3'>
                  <p className='text-lg font-bold text-gray-600'>
                    {activeSelection
                      ? `No projects match ${activeSelection}. Try another selection or clear filters.`
                      : search
                        ? 'No projects match your search. Try a different term.'
                        : 'No published projects are available yet.'}
                  </p>
                </div>
              ) : (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLike={handleLike}
                    isLiked={likedProjectIds.includes(String(project.id))}
                    isBookmarked={bookmarkedProjectIds.includes(
                      String(project.id),
                    )}
                    bookmarkPending={bookmarkPendingId === String(project.id)}
                    onBookmark={handleBookmark}
                  />
                ))
              )}
            </div>
          ))}

        {!error && !loading && totalPages > 1 && (
          <nav
            aria-label='Project pages'
            className='mt-12 flex items-center justify-center gap-3'
          >
            <button
              type='button'
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className='btn-brutal min-h-11 rounded-xl border-2 border-dark bg-white px-5 py-3 font-bold text-dark shadow-brutal-sm hover:bg-yellow-50 disabled:pointer-events-none disabled:opacity-50'
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  type='button'
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  aria-label={`Page ${pageNumber}`}
                  className={`btn-brutal flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dark font-bold shadow-brutal-sm ${
                    pageNumber === page
                      ? 'bg-primary text-dark'
                      : 'bg-white text-dark hover:bg-yellow-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type='button'
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className='btn-brutal min-h-11 rounded-xl border-2 border-dark bg-white px-5 py-3 font-bold text-dark shadow-brutal-sm hover:bg-yellow-50 disabled:pointer-events-none disabled:opacity-50'
            >
              Next
            </button>
          </nav>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default ProjectsClient
