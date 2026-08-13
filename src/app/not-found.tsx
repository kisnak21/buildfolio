import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { buttonClass } from '@/components/ui/buttonClass'

export default function NotFound() {
  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 flex flex-col items-center justify-center px-4 text-center'>
        <div className='bg-accentSoft border-4 border-dark rounded-2xl p-12 shadow-brutal-lg max-w-md w-full'>
          <p className='text-8xl font-black text-dark mb-4 drop-shadow-[4px_4px_0_var(--color-primary)]'>404</p>
          <h1 className='text-4xl font-black text-dark mb-4'>
            Page not found
          </h1>
          <p className='font-bold text-gray-700 mb-8'>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href='/'
            className={`${buttonClass('primary', 'lg')} inline-block font-black`}
          >
            Back to homepage
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
