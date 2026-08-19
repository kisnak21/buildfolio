'use client'

import { useState, useEffect, useDeferredValue } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchLikedProjects, syncLike, selectLikedProjectIds } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

const PAGE_SIZE = 6

interface ProjectsClientProps {
  techCounts: { name: string; count: number }[]
  categories: { id: string; name: string; icon: string | null }[]
}

const ProjectsClient = ({ techCounts, categories }: ProjectsClientProps) => {
  const dispatch = useAppDispatch()
  const { items: projects, loading, error, pagination } = useAppSelector(
    (state) => state.projects,
  )

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const currentUser = useAppSelector((state) => state.auth.currentUser)
  const likedProjectIds = useAppSelector(selectLikedProjectIds)

  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchProjects({ page, limit: PAGE_SIZE, sort: sortBy }))
    if (currentUser?.id) dispatch(fetchLikedProjects())
  }, [dispatch, page, sortBy, currentUser?.id])

  const filtered = projects.filter((p) => {
    const matchesSearch =
      deferredSearch === '' ||
      p.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(deferredSearch.toLowerCase())
    const matchesCategory =
      selectedCategory === '' || p.category === selectedCategory
    const matchesTech =
      selectedTech === '' ||
      (Array.isArray(p.technologies) &&
        p.technologies.some((t: string) =>
          t.toLowerCase().includes(selectedTech.toLowerCase()),
        ))
    return matchesSearch && matchesCategory && matchesTech
  })

  const sorted = [...filtered].sort((a, b) => {
    const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0
    if (sortBy === 'likes') return b.likes - a.likes
    if (sortBy === 'oldest') return aTs - bTs
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    return bTs - aTs
  })

  const totalPages = pagination?.totalPages || 1
  const handleLike = async (id: string) => {
    if (!currentUser) return
    const result = await dispatch(likeProject(id))
    const likedProject = projects.find((p) => p.id === id)
    if (likeProject.fulfilled.match(result) && likedProject) {
      dispatch(syncLike({ project: likedProject, liked: result.payload.liked }))
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
              onChange={(e) => setSearch(e.target.value)}
              className='input-brutal w-full pl-12 pr-4 py-3 bg-white border-2 border-dark rounded-xl font-bold shadow-brutal-sm transition-shadow'
            />
          </div>
          
          <div className='flex flex-wrap gap-4'>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              onChange={(e) => setSelectedTech(e.target.value)}
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
              onChange={(e) => setSortBy(e.target.value)}
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
                }}
                className='btn-brutal bg-white border-2 border-dark px-5 py-3 rounded-xl font-bold shadow-brutal-sm'
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <p className='text-sm font-bold text-gray-600 mb-6'>
          {sorted.length} project{sorted.length !== 1 ? 's' : ''} found
        </p>

        {error && <p className='text-sm font-bold text-red-600'>{error}</p>}
        {!error && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            ) : sorted.length === 0 ? (
              <div className='col-span-1 md:col-span-2 lg:col-span-3 bg-white border-4 border-dark rounded-2xl shadow-brutal p-12 text-center'>
                <p className='text-lg font-bold text-gray-600'>
                  No projects match your filters.
                </p>
              </div>
            ) : (
              sorted.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
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
