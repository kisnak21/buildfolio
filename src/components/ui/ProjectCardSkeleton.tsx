const ProjectCardSkeleton = () => {
  return (
    <div className='card-brutal bg-white border-4 border-dark rounded-2xl overflow-hidden flex flex-col shadow-brutal animate-pulse'>
      <div className='aspect-video bg-gray-200 border-b-4 border-dark'></div>
      <div className='p-5 flex flex-col flex-1 gap-4'>
        <div className='h-6 bg-gray-200 rounded w-3/4 border-2 border-dark'></div>
        <div className='space-y-2'>
          <div className='h-4 bg-gray-200 rounded w-full border-2 border-dark'></div>
          <div className='h-4 bg-gray-200 rounded w-5/6 border-2 border-dark'></div>
        </div>
        <div className='flex gap-2 mb-4'>
          <div className='h-6 w-16 bg-gray-200 rounded border-2 border-dark'></div>
          <div className='h-6 w-20 bg-gray-200 rounded border-2 border-dark'></div>
        </div>
        <div className='mt-auto flex items-center justify-between pt-4 border-t-2 border-dark border-dashed'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-full bg-gray-200 border-2 border-dark'></div>
            <div className='h-4 w-20 bg-gray-200 rounded border-2 border-dark'></div>
          </div>
          <div className='h-5 w-8 bg-gray-200 rounded border-2 border-dark'></div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCardSkeleton
