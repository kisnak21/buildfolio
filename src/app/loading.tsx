import { CodeBracketIcon } from '@heroicons/react/24/solid'

export default function Loading() {
  return (
    <main className='grid min-h-screen place-items-center bg-bgMain px-4'>
      <div
        role='status'
        aria-live='polite'
        className='flex items-center gap-3 rounded-2xl border-4 border-dark bg-white px-5 py-4 font-black shadow-brutal'
      >
        <div className='flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dark bg-secondary shadow-brutal-sm'>
          <CodeBracketIcon className='h-6 w-6' aria-hidden />
        </div>
        Loading page…
      </div>
    </main>
  )
}
