import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProjectsClient from './ProjectsClient'
import { getTechnologyStats } from '@/lib/services/projectService'
import prisma from '@/lib/db'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Projects',
  description:
    'Browse all developer projects on Buildfolio. Filter by category, technology, and more.',
}

const ProjectsFallback = () => (
  <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
    <Header />
    <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
      <div className='mb-8 border-b-4 border-dark pb-6'>
        <h1 className='text-4xl font-black mb-2'>All Projects</h1>
        <p className='font-bold text-gray-600 text-lg'>Loading projects...</p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {Array.from({ length: 6 }).map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    </main>
    <Footer />
  </div>
)

export default async function ProjectsPage() {
  const [techCounts, categories] = await Promise.all([
    getTechnologyStats(),
    prisma.category.findMany({
      select: { id: true, name: true, icon: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return (
    <Suspense fallback={<ProjectsFallback />}>
      <ProjectsClient techCounts={techCounts} categories={categories} />
    </Suspense>
  )
}
