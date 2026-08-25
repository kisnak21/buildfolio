'use client'

import Link from 'next/link'
import { LightBulbIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const IdeasClient = () => {
  return (
    <div className='flex min-h-screen flex-col bg-bgMain text-dark'>
      <Header />
      <main className='mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:py-14'>
        <div className='mb-10 flex items-center justify-between gap-4 border-b-4 border-dark pb-8'>
          <div className='inline-flex items-center gap-2 rounded-lg border-2 border-dark bg-secondary px-3 py-1.5 text-sm font-black uppercase shadow-brutal-sm'>
            <LightBulbIcon className='h-4 w-4' aria-hidden />
            Idea workshop
          </div>
          <Link
            href='/dashboard'
            className='font-black underline decoration-2 underline-offset-4 hover:text-accentDark'
          >
            Back to dashboard
          </Link>
        </div>

        <div className='flex flex-1 items-center justify-center py-8'>
          <div className='w-full max-w-2xl rounded-2xl border-4 border-dark bg-white p-8 text-center shadow-brutal-lg sm:p-12'>
            <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-dark bg-accentSoft shadow-brutal'>
              <ClockIcon className='h-10 w-10' aria-hidden />
            </div>
            <div className='mx-auto mt-6 inline-flex items-center gap-2 rounded-full border-2 border-dark bg-secondary px-4 py-1.5 text-xs font-black uppercase tracking-wide shadow-brutal-sm'>
              <SparklesIcon className='h-3.5 w-3.5' aria-hidden />
              Coming soon
            </div>
            <h1 className='mt-6 text-4xl font-black leading-tight sm:text-5xl'>
              Project Ideas is coming soon.
            </h1>
            <p className='mx-auto mt-4 max-w-xl text-lg font-semibold leading-relaxed text-gray-600'>
              We are evaluating alternative AI models to make idea generation
              faster and more reliable. The workspace will return with scoped
              ideas, PRD, Design Spec, Style Guide, and README generation.
            </p>
            <p className='mx-auto mt-3 max-w-xl text-sm font-semibold text-gray-500'>
              Routing stays at <span className='font-black text-dark'>/dashboard/ideas</span> — check back after the model evaluation. No generations are consumed while this page is in preview.
            </p>
            <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Link
                href='/dashboard'
                className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-dark bg-dark px-6 py-3 font-black text-white shadow-brutal hover:bg-accentDark'
              >
                Back to dashboard
              </Link>
              <Link
                href='/dashboard/new'
                className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-dark bg-white px-6 py-3 font-black shadow-brutal-sm hover:bg-inputBg'
              >
                Create project manually
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default IdeasClient
