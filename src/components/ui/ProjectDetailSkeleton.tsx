const ProjectDetailSkeleton = () => {
  return (
    <div className='max-w-4xl mx-auto px-4 py-12 w-full animate-pulse'>
      <div className='h-6 bg-gray-200 rounded w-24 mb-6 border-2 border-dark'></div>
      
      <div className='bg-white border-4 border-dark rounded-2xl p-6 mb-6 shadow-brutal'>
        <div className='flex flex-col gap-4'>
          <div className='h-6 w-20 bg-gray-200 rounded border-2 border-dark'></div>
          <div className='h-10 bg-gray-300 rounded w-1/2 border-2 border-dark'></div>
          <div className='space-y-2 mt-2'>
            <div className='h-4 bg-gray-200 rounded w-full border-2 border-dark'></div>
            <div className='h-4 bg-gray-200 rounded w-5/6 border-2 border-dark'></div>
          </div>
          <div className='flex gap-2 my-2'>
            <div className='h-6 w-16 bg-gray-200 rounded border-2 border-dark'></div>
            <div className='h-6 w-20 bg-gray-200 rounded border-2 border-dark'></div>
          </div>
          <div className='flex items-center gap-2 border-t-2 border-dark border-dashed pt-4 mt-2'>
            <div className='w-8 h-8 rounded-full bg-gray-300 border-2 border-dark'></div>
            <div className='h-4 w-28 bg-gray-200 rounded border-2 border-dark'></div>
          </div>
        </div>
      </div>

      <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
        <div className='h-6 bg-gray-300 rounded w-1/4 mb-6 border-2 border-dark'></div>
        <div className='flex items-start gap-3 mb-6'>
          <div className='w-8 h-8 rounded-full bg-gray-300 border-2 border-dark shrink-0'></div>
          <div className='flex-1 gap-2 flex flex-col'>
            <div className='h-16 bg-gray-100 rounded-xl border-2 border-dark w-full'></div>
            <div className='h-8 bg-gray-200 rounded-lg border-2 border-dark w-24 mt-2'></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailSkeleton
