import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import ProjectGridSkeleton from './ProjectGridSkeleton'
import SkeletonBlock from './SkeletonBlock'

const ProjectsPageSkeleton = () => (
  <div className='flex min-h-screen flex-col bg-bgMain text-dark'>
    <Header />
    <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-12'>
      <div className='mb-8 border-b-4 border-dark pb-6'>
        <h1 className='mb-2 text-4xl font-black'>Explore Projects</h1>
        <p className='text-lg font-bold text-gray-600'>Loading projects…</p>
      </div>

      <div
        aria-hidden='true'
        className='skeleton-loading mb-8 flex flex-col gap-4 rounded-2xl border-4 border-dark bg-accentSoft p-4 shadow-brutal-sm md:flex-row'
      >
        <SkeletonBlock className='h-12 flex-1 rounded-xl bg-white' />
        <div className='flex flex-wrap gap-4'>
          <SkeletonBlock className='h-12 min-w-40 flex-1 rounded-xl bg-white md:flex-none' />
          <SkeletonBlock className='h-12 min-w-40 flex-1 rounded-xl bg-white md:flex-none' />
          <SkeletonBlock className='h-12 min-w-32 flex-1 rounded-xl bg-secondary md:flex-none' />
        </div>
      </div>

      <ProjectGridSkeleton count={6} />
    </main>
    <Footer />
  </div>
)

export default ProjectsPageSkeleton
