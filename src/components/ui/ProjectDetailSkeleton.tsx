import SkeletonBlock from './SkeletonBlock'

const ProjectDetailSkeleton = () => {
  return (
    <div role='status' aria-busy='true' aria-live='polite'>
      <span className='sr-only'>Loading project details</span>

      <div
        aria-hidden='true'
        className='skeleton-loading relative mb-8 rounded-2xl border-4 border-dark bg-white p-6 shadow-brutal sm:p-8'
      >
        <SkeletonBlock className='absolute right-4 top-4 h-9 w-24 rounded-lg bg-white' />
        <SkeletonBlock className='mb-6 aspect-video w-full rounded-xl bg-gray-100' />
        <div className='flex flex-col gap-4'>
          <SkeletonBlock className='h-8 w-28' />
          <SkeletonBlock className='h-12 w-3/4 bg-gray-300' />
          <div className='mt-2 space-y-2'>
            <SkeletonBlock className='h-5 w-full' />
            <SkeletonBlock className='h-5 w-5/6' />
          </div>
          <div className='flex gap-2 my-2'>
            <SkeletonBlock className='h-7 w-16' />
            <SkeletonBlock className='h-7 w-20' />
            <SkeletonBlock className='h-7 w-14' />
          </div>
          <div className='mt-2 flex items-center gap-3 border-t-2 border-dashed border-dark pt-6'>
            <SkeletonBlock className='h-10 w-10 rounded-full bg-gray-300' />
            <div className='space-y-2'>
              <SkeletonBlock className='h-4 w-28' />
              <SkeletonBlock className='h-3 w-16 border-0' />
            </div>
          </div>
          <div className='flex flex-wrap gap-4 border-t-2 border-dashed border-dark pt-6'>
            <SkeletonBlock className='h-12 w-28 rounded-xl bg-white' />
            <SkeletonBlock className='h-12 w-32 rounded-xl bg-white' />
            <SkeletonBlock className='h-12 w-24 rounded-xl bg-white' />
          </div>
        </div>
      </div>

      <div
        aria-hidden='true'
        className='skeleton-loading rounded-2xl border-4 border-dark bg-white p-6 shadow-brutal sm:p-8'
      >
        <SkeletonBlock className='mb-6 h-8 w-36 bg-gray-300' />
        <div className='mb-8 flex items-start gap-4 border-b-2 border-dashed border-dark pb-8'>
          <SkeletonBlock className='h-10 w-10 shrink-0 rounded-full bg-gray-300' />
          <div className='flex flex-1 flex-col gap-3'>
            <SkeletonBlock className='h-24 w-full rounded-xl bg-gray-100' />
            <SkeletonBlock className='h-11 w-32 rounded-xl bg-primary' />
          </div>
        </div>
        <div className='flex items-start gap-4'>
          <SkeletonBlock className='h-10 w-10 shrink-0 rounded-full bg-gray-300' />
          <div className='flex-1 space-y-3'>
            <SkeletonBlock className='h-5 w-40' />
            <SkeletonBlock className='h-16 w-full rounded-xl bg-gray-100' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailSkeleton
