'use client'

import { useState, useEffect, useDeferredValue } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { fetchProjects, likeProject } from '@/store/redux/projectsSlice'
import { fetchLikedProjects, syncLike } from '@/store/redux/likesSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import Section from '@/components/home/Section'
import ProjectCard from '@/components/home/ProjectCard'
import CategoryCard from '@/components/home/CategoryCard'
import TechPill from '@/components/home/TechPill'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { MagnifyingGlassIcon, RocketLaunchIcon, CpuChipIcon, GlobeAltIcon, DevicePhoneMobileIcon, LockOpenIcon, PuzzlePieceIcon } from '@heroicons/react/24/solid'

interface HomeClientProps {
  techCounts: { name: string; count: number }[]
}

const categoryList = [
  { icon: <RocketLaunchIcon />, name: 'SaaS' },
  { icon: <CpuChipIcon />, name: 'AI' },
  { icon: <GlobeAltIcon />, name: 'Web App' },
  { icon: <DevicePhoneMobileIcon />, name: 'Mobile App' },
  { icon: <LockOpenIcon />, name: 'Open Source' },
  { icon: <PuzzlePieceIcon />, name: 'Game' },
]

const HomeClient = ({ techCounts }: HomeClientProps) => {
  const dispatch = useAppDispatch()
  const {
    items: projects,
    loading,
    error,
  } = useAppSelector((state) => state.projects)
  const { currentUser } = useAppSelector((state) => state.auth)
  const likedProjectIds = useAppSelector((state) => state.likes.items.map((i) => String(i.id)))

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    dispatch(fetchProjects() as any)
    if (currentUser?.id) dispatch(fetchLikedProjects() as any)
  }, [dispatch, currentUser?.id])

  const filtered = projects.filter((p: any) => {
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

  const sortedByLikes = [...filtered].sort(
    (a: any, b: any) => b.likes - a.likes,
  )
  const featuredProjects = sortedByLikes.slice(0, 3)
  const favoriteProjects = sortedByLikes.slice(3, 6)

  const derivedCategories = categoryList.map((cat) => ({
    ...cat,
    count: projects.filter((p: any) => p.category === cat.name).length,
  }))

  const handleLike = async (id: string) => {
    if (!currentUser) {
      window.location.href = '/login'
      return
    }
    const result = await dispatch(likeProject(id) as any)
    if (likeProject.fulfilled.match(result)) {
      dispatch(syncLike({ project: projects.find((p: any) => p.id === id) as any, liked: result.payload.liked }))
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
                {categoryList.map((cat) => (
                  <option key={cat.name} value={cat.name}>
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
                {filtered.length} project{filtered.length !== 1 ? 's' : ''} found
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
                : featuredProjects.map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onLike={handleLike}
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
          className='bg-[#fed7aa] border-t-4 border-b-4 border-dark'
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
          className='bg-[#bbf7d0] border-b-4 border-dark'
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
                : favoriteProjects.map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onLike={handleLike}
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
