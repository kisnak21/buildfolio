import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 flex flex-col items-center justify-center px-4 text-center'>
        <p className='text-6xl font-semibold text-gray-200 mb-4'>404</p>
        <h1 className='text-xl font-semibold text-gray-900 mb-2'>
          Page not found
        </h1>
        <p className='text-sm text-gray-500 mb-6'>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href='/'
          className='text-sm bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors'
        >
          Back to homepage
        </Link>
      </main>
      <Footer />
    </div>
  )
}
