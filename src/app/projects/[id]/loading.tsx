import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import ProjectDetailSkeleton from '@/components/ui/ProjectDetailSkeleton'
import SkeletonBlock from '@/components/ui/SkeletonBlock'

export default function Loading() {
  return (
    <div className='flex min-h-screen flex-col bg-bgMain text-dark'>
      <Header />
      <main className='mx-auto w-full max-w-4xl flex-1 px-4 py-12'>
        <div aria-hidden='true' className='skeleton-loading mb-8'>
          <SkeletonBlock className='h-11 w-40 rounded-xl bg-white' />
        </div>
        <ProjectDetailSkeleton />
      </main>
      <Footer />
    </div>
  )
}
