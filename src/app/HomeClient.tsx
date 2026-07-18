'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import Section from '@/components/home/Section'
import ProjectCard from '@/components/home/ProjectCard'
import CategoryCard from '@/components/home/CategoryCard'
import TechPill from '@/components/home/TechPill'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { technologies } from '@/lib/data/project'

const categoryList = [
  { icon: '🚀', name: 'SaaS' },
  { icon: '🤖', name: 'AI' },
  { icon: '🌐', name: 'Web App' },
  { icon: '📱', name: 'Mobile App' },
  { icon: '🔓', name: 'Open Source' },
  { icon: '🎮', name: 'Game' },
]

const HomeClient = () => {
  const dispatch = useDispatch()
  const {
    items: projects,
    loading,
    error,
  } = useSelector((state: any) => state.projects)
  const { currentUser } = useSelector((state: any) => state.auth)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTech, setSelectedTech] = useState('')

  useEffect(() => {
    dispatch(fetchProjects({ search, category: selectedCategory, sort: 'newest', limit: 6 }) as any)
  }, [dispatch, search, selectedCategory])

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

  const sortedByLikes = [...filtered].sort(
    (a: any, b: any) => b.likes - a.likes,
  )
  const featuredProjects = sortedByLikes.slice(0, 3)
  const favoriteProjects = sortedByLikes.slice(3, 6)

  const derivedCategories = categoryList.map((cat) => ({
    ...cat,
    count: projects.filter((p: any) => p.category === cat.name).length,
  }))

  const techCounts = technologies.map((tech) => ({
    ...tech,
    count: projects.filter(
      (p: any) =>
        Array.isArray(p.technologies) &&
        p.technologies.some((t: string) =>
          t.toLowerCase().includes(tech.name.toLowerCase()),
        ),
    ).length,
  }))

  const handleLike = (id: string, currentLikes: number) => {
    dispatch(likeProject(id) as any)
  }

  return (
    <div className='bg-gray-50 text-gray-900'>
      <Header />

      <main>
        <Hero currentUser={currentUser} />

        {/* Search + Filter */}
        <div className='max-w-6xl mx-auto px-4 mb-4'>
          <div className='flex flex-col md:flex-row gap-3'>
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
              className='bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
            >
              <option value=''>All Categories</option>
              {categoryList.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className='bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
            >
              <option value=''>All Technologies</option>
              {technologies.map((tech) => (
                <option key={tech.name} value={tech.name}>
                  {tech.name}
                </option>
              ))}
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
                Clear filters
              </button>
            )}
          </div>
          {(search || selectedCategory || selectedTech) && (
            <p className='text-xs text-gray-400 mt-2'>
              {filtered.length} project{filtered.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        <Section
          id='projects'
          title='Featured Projects'
          subtitle='Handpicked by the community'
          viewAllHref='/projects'
        >
          {error && <p className='text-sm text-red-500'>{error}</p>}
          {!error && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                  ))
                : featuredProjects.map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onLike={handleLike}
                    />
                  ))}
            </div>
          )}
        </Section>

        <Section
          id='categories'
          title='Browse by Category'
          subtitle='Find projects that match your interests'
        >
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
            {derivedCategories.map((category) => (
              <CategoryCard
                key={category.name}
                {...category}
                isSelected={selectedCategory === category.name}
                onClick={() => {
                  setSelectedCategory(
                    selectedCategory === category.name ? '' : category.name,
                  )
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        </Section>

        <Section
          id='technologies'
          title='Trending Technologies'
          subtitle='What developers are building with right now'
        >
          <div className='flex flex-wrap gap-2'>
            {techCounts.map((tech) => (
              <TechPill
                key={tech.name}
                {...tech}
                isSelected={selectedTech === tech.name}
                onClick={() => {
                  setSelectedTech(selectedTech === tech.name ? '' : tech.name)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        </Section>

        <Section
          id='favorites'
          title='Community Favorites'
          subtitle='Most liked projects this month'
          viewAllHref='/projects'
        >
          {error && <p className='text-sm text-red-500'>{error}</p>}
          {!error && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                  ))
                : favoriteProjects.map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onLike={handleLike}
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
