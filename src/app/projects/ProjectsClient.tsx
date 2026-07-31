'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { technologies } from '@/lib/data/project'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

const categoryList = ['SaaS', 'AI', 'Web App', 'Mobile App', 'Open Source', 'Game']

const PAGE_SIZE = 6

const ProjectsClient = () => {
  const dispatch = useDispatch()
  const { items: projects, loading, error, pagination } = useSelector(
    (state: any) => state.projects,
  )

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(
      fetchProjects({ page, limit: PAGE_SIZE, sort: sortBy }) as any,
    )
  }, [dispatch, page, sortBy])

  const filtered = projects.filter((p: any) => {
    const matchesSearch =
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
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

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortBy === 'likes') return b.likes - a.likes
    if (sortBy === 'oldest')
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const totalPages = pagination?.totalPages || 1
  const handleLike = (id: string, currentLikes: number) => {
    dispatch(likeProject(id) as any)
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
        <div className='flex flex-col md:flex-row gap-4 mb-8 bg-[#c4f0ff] p-4 border-4 border-dark rounded-2xl shadow-brutal-sm'>
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
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className='input-brutal flex-1 md:flex-none bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm appearance-none cursor-pointer'
            >
              <option value=''>All Technologies</option>
              {technologies.map((tech) => (
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

        <p className='text-sm font-bold text-gray-500 mb-6'>
          {sorted.length} project{sorted.length !== 1 ? 's' : ''} found
        </p>

        {error && <p className='text-sm font-bold text-red-500'>{error}</p>}
        {!error && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            ) : sorted.length === 0 ? (
              <div className='col-span-1 md:col-span-2 lg:col-span-3 bg-white border-4 border-dark rounded-2xl shadow-brutal p-12 text-center'>
                <p className='text-lg font-bold text-gray-500'>
                  No projects match your filters.
                </p>
              </div>
            ) : (
              sorted.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
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
                    ? 'bg-primary text-dark shadow-[2px_2px_0px_0px_#111111] transform -translate-y-0.5'
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
