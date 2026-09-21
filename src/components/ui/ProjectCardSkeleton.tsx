import SkeletonBlock from './SkeletonBlock'

interface ProjectCardSkeletonProps {
  showBookmark?: boolean
}

const ProjectCardSkeleton = ({
  showBookmark = true,
}: ProjectCardSkeletonProps) => {
  return (
    <article
      aria-hidden='true'
      className='skeleton-loading flex flex-col overflow-hidden rounded-2xl border-4 border-dark bg-white shadow-brutal'
    >
      <div className='relative flex aspect-video items-center justify-center border-b-4 border-dark bg-gray-100'>
        <SkeletonBlock className='h-16 w-16 rounded-xl bg-gray-300' />
        <SkeletonBlock className='absolute left-3 top-3 h-7 w-24' />
        <div className='absolute right-3 top-3 flex gap-1'>
          {showBookmark && (
            <SkeletonBlock className='h-10 w-10 rounded-full bg-white' />
          )}
          <SkeletonBlock className='h-10 w-10 rounded-full bg-white' />
        </div>
      </div>
      <div className='flex flex-1 flex-col p-5'>
        <SkeletonBlock className='mb-2 h-7 w-3/4 bg-gray-300' />
        <div className='mb-4 space-y-2'>
          <SkeletonBlock className='h-4 w-full' />
          <SkeletonBlock className='h-4 w-5/6' />
        </div>
        <div className='mb-6 flex flex-wrap gap-2'>
          <SkeletonBlock className='h-7 w-16' />
          <SkeletonBlock className='h-7 w-20' />
          <SkeletonBlock className='h-7 w-14' />
        </div>
        <div className='mt-auto flex min-h-14 items-center justify-between border-t-2 border-dashed border-dark pt-4'>
          <div className='flex items-center gap-2'>
            <SkeletonBlock className='h-8 w-8 rounded-full bg-gray-300' />
            <SkeletonBlock className='h-4 w-20' />
          </div>
          <div className='flex items-center gap-3'>
            <SkeletonBlock className='h-10 w-20 rounded-lg bg-white' />
            <SkeletonBlock className='h-5 w-10 border-0' />
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProjectCardSkeleton
