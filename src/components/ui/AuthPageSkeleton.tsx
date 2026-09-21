import { CodeBracketIcon } from '@heroicons/react/24/solid'
import SkeletonBlock from './SkeletonBlock'

interface AuthPageSkeletonProps {
  fieldCount?: number
  showDivider?: boolean
  showCheckbox?: boolean
}

const AuthPageSkeleton = ({
  fieldCount = 2,
  showDivider = false,
  showCheckbox = false,
}: AuthPageSkeletonProps) => (
  <div className='flex min-h-screen items-center justify-center bg-bgMain px-4 py-10'>
    <div
      role='status'
      aria-busy='true'
      aria-live='polite'
      className='w-full max-w-sm'
    >
      <span className='sr-only'>Loading account form</span>
      <div
        aria-hidden='true'
        className='mb-8 flex items-center gap-2 text-2xl font-black tracking-tight'
      >
        <div className='flex h-8 w-8 items-center justify-center rounded-md border-2 border-dark bg-secondary shadow-brutal-sm'>
          <CodeBracketIcon className='h-5 w-5 text-dark' />
        </div>
        buildfolio
      </div>

      <div
        aria-hidden='true'
        className='skeleton-loading relative rounded-2xl border-4 border-dark bg-white p-8 shadow-brutal-lg'
      >
        <SkeletonBlock className='mb-3 h-9 w-3/4 bg-gray-300' />
        <SkeletonBlock className='mb-8 h-5 w-full' />
        <div className='space-y-5'>
          {Array.from({ length: fieldCount }, (_, index) => (
            <div key={index}>
              <SkeletonBlock className='mb-2 h-4 w-24 border-0' />
              <SkeletonBlock className='h-12 w-full rounded-xl bg-white' />
            </div>
          ))}
        </div>
        {showCheckbox && (
          <div className='mt-5 flex items-center gap-3'>
            <SkeletonBlock className='h-5 w-5 rounded bg-white' />
            <SkeletonBlock className='h-4 w-32 border-0' />
          </div>
        )}
        <SkeletonBlock className='mt-6 h-12 w-full rounded-xl bg-primary' />
        {showDivider && (
          <>
            <div className='my-6 flex items-center gap-3'>
              <div className='h-0.5 flex-1 bg-dark' />
              <SkeletonBlock className='h-4 w-6 border-0' />
              <div className='h-0.5 flex-1 bg-dark' />
            </div>
            <SkeletonBlock className='h-12 w-full rounded-xl bg-white' />
          </>
        )}
        <SkeletonBlock className='mx-auto mt-6 h-4 w-48 border-0' />
      </div>
    </div>
  </div>
)

export default AuthPageSkeleton
