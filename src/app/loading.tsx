import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'

export default function Loading() {
  return (
    <div className='min-h-screen flex flex-col bg-bgMain'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-10 w-full'>
        <div className='h-10 w-64 bg-gray-200 border-2 border-dark rounded-xl animate-pulse mb-8' />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </main>
      <Footer />
    </div>
  )
}
