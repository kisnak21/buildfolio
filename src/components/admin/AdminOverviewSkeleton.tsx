import SkeletonBlock from '@/components/ui/SkeletonBlock'

const PanelSkeleton = ({ wide = false }: { wide?: boolean }) => (
  <div
    className={`skeleton-loading rounded-2xl border-4 border-dark bg-white p-6 shadow-brutal ${wide ? 'lg:col-span-2' : ''}`}
  >
    <SkeletonBlock className='mb-6 h-7 w-48 bg-gray-300' />
    <div className='flex h-44 items-end gap-2'>
      {[45, 70, 38, 82, 56, 66, 92].map((height, index) => (
        <SkeletonBlock
          key={index}
          className='flex-1 rounded-b-none'
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  </div>
)

const AdminOverviewSkeleton = () => (
  <div role='status' aria-busy='true' aria-live='polite'>
    <span className='sr-only'>Loading platform statistics</span>
    <div
      aria-hidden='true'
      className='mb-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-5'
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className='skeleton-loading rounded-2xl border-4 border-dark bg-white p-5 shadow-brutal'
        >
          <SkeletonBlock className='mb-3 h-4 w-20 border-0' />
          <SkeletonBlock className='h-10 w-16 bg-gray-300' />
        </div>
      ))}
    </div>

    <div aria-hidden='true' className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <PanelSkeleton wide />
      <div className='skeleton-loading rounded-2xl border-4 border-dark bg-white p-6 shadow-brutal'>
        <SkeletonBlock className='mb-5 h-7 w-40 bg-gray-300' />
        <div className='space-y-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className='flex items-center gap-3'>
              <SkeletonBlock className='h-9 w-9 shrink-0 rounded-full bg-gray-300' />
              <div className='flex-1 space-y-2'>
                <SkeletonBlock className='h-4 w-3/4' />
                <SkeletonBlock className='h-3 w-1/2 border-0' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div
      aria-hidden='true'
      className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3'
    >
      <PanelSkeleton wide />
      <div className='skeleton-loading rounded-2xl border-4 border-dark bg-white p-6 shadow-brutal'>
        <SkeletonBlock className='mb-5 h-7 w-48 bg-gray-300' />
        <div className='space-y-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className='space-y-2'>
              <SkeletonBlock className='h-4 w-2/3 border-0' />
              <SkeletonBlock className='h-4 w-full' />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default AdminOverviewSkeleton
