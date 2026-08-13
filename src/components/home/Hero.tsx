import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/solid'

interface HeroProps {
  currentUser: { id: string; name: string } | null
}

const Hero = ({ currentUser }: HeroProps) => {
  return (
    <section className='py-16 md:py-24 border-b-4 border-dark bg-accentSoft'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='grid md:grid-cols-2 gap-12 items-center'>
          <div className='space-y-6'>
            <h1 className='text-5xl md:text-7xl font-black leading-[1.1] tracking-tight'>
              Discover.<br />
              Share.<br />
              <span className='bg-secondary px-2 border-2 border-dark shadow-brutal-sm'>Build.</span>
            </h1>
            <p className='text-lg md:text-xl font-medium max-w-lg leading-relaxed text-dark'>
              The platform for developers to showcase their work, find inspiration, and connect with other builders.
            </p>
            <div className='flex flex-wrap gap-4 pt-4'>
              <a
                href='#projects'
                className='btn-brutal bg-dark text-white border-2 border-dark px-8 py-4 rounded-xl font-bold text-lg shadow-brutal flex items-center gap-2'
              >
                Start Exploring
                <ArrowRightIcon className='w-5 h-5' />
              </a>
              <Link
                href={currentUser ? '/dashboard/new' : '/register'}
                className='btn-brutal bg-white text-dark border-2 border-dark px-8 py-4 rounded-xl font-bold text-lg shadow-brutal'
              >
                Submit Project
              </Link>
            </div>
          </div>
          
          <div className='hidden md:block relative'>
            <div className='absolute inset-0 bg-primary border-4 border-dark rounded-2xl shadow-brutal-lg transform rotate-3'></div>
            <div className='relative bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal-lg transform -rotate-1 aspect-video flex flex-col'>
              <div className='flex gap-2 mb-4 border-b-2 border-dark pb-4'>
                <div className='w-4 h-4 rounded-full border-2 border-dark bg-red-400'></div>
                <div className='w-4 h-4 rounded-full border-2 border-dark bg-secondary'></div>
                <div className='w-4 h-4 rounded-full border-2 border-dark bg-green-400'></div>
              </div>
              <div className='flex-1 rounded-xl border-2 border-dark bg-bgMain p-4 flex flex-col gap-3'>
                <div className='h-4 bg-gray-200 border-2 border-dark rounded w-3/4'></div>
                <div className='h-4 bg-gray-200 border-2 border-dark rounded w-1/2'></div>
                <div className='h-4 bg-gray-200 border-2 border-dark rounded w-5/6'></div>
                <div className='mt-auto flex justify-end'>
                  <div className='h-8 w-24 bg-accent border-2 border-dark rounded-lg'></div>
                </div>
              </div>
            </div>
            <div className='absolute -bottom-6 -left-6 w-16 h-16 bg-secondary border-4 border-dark rounded-full shadow-brutal z-10 flex items-center justify-center'>
              <SparklesIcon className='w-8 h-8 text-dark' />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
