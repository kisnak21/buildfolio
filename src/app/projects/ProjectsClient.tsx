'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { likeProject } from '@/store/redux/projectsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/home/ProjectCard'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { technologies } from '@/lib/data/projects'

const categoryList = [
  'SaaS',
  'AI',
  'Web App',
  'Mobile App',
  'Open Source',
  'Game',
]

const ProjectsClient = () => {
  const dispatch = useDispatch()
  const {
    items: projects,
    loading,
    error,
  } = useSelector((state: any) => state.projects)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [sortBy, setSortBy] = useState('newest')

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

  const handleLike = (id: string, currentLikes: number) => {
    dispatch(likeProject({ id, currentLikes }) as any)
  }

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8'>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>
            All Projects
          </h1>
          <p className='text-sm text-gray-500'>
            {projects.length} projects on Buildfolio
          </p>
        </div>

        {/* Filters */}
        <div className='flex flex-col md:flex-row gap-3 mb-6'>
          <input
            type='text'
            placeholder='Search projects...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className='bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary transition-colors'
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
            className='bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary transition-colors'
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
            className='bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary transition-colors'
          >
            <option value='newest'>Newest</option>
            <option value='likes'>Most Liked</option>
            <option value='oldest'>Oldest</option>
            <option value='title'>A–Z</option>
          </select>
          {(search || selectedCategory || selectedTech) && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory('')
                setSelectedTech('')
              }}
              className='text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap'
            >
              Clear
            </button>
          )}
        </div>

        <p className='text-xs text-gray-400 mb-4'>
          {sorted.length} project{sorted.length !== 1 ? 's' : ''} found
        </p>

        {error && <p className='text-sm text-red-500'>{error}</p>}
        {!error && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            ) : sorted.length === 0 ? (
              <div className='col-span-3 bg-white border border-gray-200 rounded-xl p-12 text-center'>
                <p className='text-sm text-gray-400'>
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
      </main>
      <Footer />
    </div>
  )
}

export default ProjectsClient
