const ProjectCardSkeleton = () => {
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 animate-pulse'>
      <div className='flex items-start justify-between'>
        <div className='h-5 w-16 bg-gray-100 rounded-md' />
        <div className='h-4 w-8 bg-gray-100 rounded' />
      </div>
      <div className='flex flex-col gap-2'>
        <div className='h-4 w-3/4 bg-gray-100 rounded' />
        <div className='h-3 w-full bg-gray-100 rounded' />
        <div className='h-3 w-2/3 bg-gray-100 rounded' />
      </div>
      <div className='flex gap-1'>
        <div className='h-5 w-14 bg-gray-100 rounded' />
        <div className='h-5 w-14 bg-gray-100 rounded' />
      </div>
      <div className='flex items-center justify-between pt-1 border-t border-gray-100'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-full bg-gray-100' />
          <div className='h-3 w-16 bg-gray-100 rounded' />
        </div>
        <div className='h-3 w-20 bg-gray-100 rounded' />
      </div>
    </div>
  )
}

export default ProjectCardSkeleton
