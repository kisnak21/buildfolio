import SkeletonBlock from './SkeletonBlock'

export const CommentThreadSkeleton = () => (
  <div role='status' aria-busy='true' aria-live='polite'>
    <span className='sr-only'>Loading comments</span>
    <div
      aria-hidden='true'
      className='skeleton-loading flex items-start gap-4'
    >
      <SkeletonBlock className='h-10 w-10 shrink-0 rounded-full bg-gray-300' />
      <div className='flex-1 rounded-xl border-2 border-dark bg-bgMain px-4 py-3 shadow-brutal-sm'>
        <SkeletonBlock className='mb-3 h-4 w-40' />
        <SkeletonBlock className='mb-2 h-4 w-full border-0' />
        <SkeletonBlock className='h-4 w-3/4 border-0' />
      </div>
    </div>
  </div>
)

export const ModerationListSkeleton = () => (
  <div role='status' aria-busy='true' aria-live='polite' className='space-y-4'>
    <span className='sr-only'>Loading comment moderation queue</span>
    {Array.from({ length: 3 }, (_, index) => (
      <article
        key={index}
        aria-hidden='true'
        className='skeleton-loading rounded-2xl border-4 border-dark bg-white p-5 shadow-brutal'
      >
        <div className='mb-3 flex items-start gap-3'>
          <SkeletonBlock className='h-9 w-9 shrink-0 rounded-full bg-gray-300' />
          <div className='min-w-0 flex-1 space-y-2'>
            <SkeletonBlock className='h-4 w-56' />
            <SkeletonBlock className='h-3 w-24 border-0' />
          </div>
          <div className='flex gap-2'>
            <SkeletonBlock className='h-11 w-20 rounded-xl bg-warningSoft' />
            <SkeletonBlock className='h-11 w-20 rounded-xl bg-dangerSoft' />
          </div>
        </div>
        <div className='space-y-2 sm:pl-12'>
          <SkeletonBlock className='h-4 w-full border-0' />
          <SkeletonBlock className='h-4 w-4/5 border-0' />
        </div>
      </article>
    ))}
  </div>
)
