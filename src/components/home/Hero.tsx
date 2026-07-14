import Link from 'next/link'

interface HeroProps {
  currentUser: { id: string; name: string } | null
}

const Hero = ({ currentUser }: HeroProps) => {
  return (
    <section className='max-w-6xl mx-auto px-4 py-24 text-center'>
      <div className='inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6'>
        <span className='w-1.5 h-1.5 bg-primary rounded-full'></span>
        <span className='text-xs text-blue-600'>
          Open to developers worldwide
        </span>
      </div>

      <h1 className='text-4xl md:text-6xl font-semibold text-gray-900 leading-tight tracking-tight mb-6'>
        Discover Projects.
        <br />
        Share Ideas.
        <br />
        <span className='text-primary'>Build Your Portfolio.</span>
      </h1>

      <p className='text-base md:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed'>
        The platform for developers to showcase their work, discover what others
        are building, and connect with a community that ships.
      </p>

      <div className='flex items-center justify-center gap-3 flex-wrap'>
        <a
          href='#projects'
          className='bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors'
        >
          Explore Projects
        </a>
        <Link
          href={currentUser ? '/projects/new' : '/register'}
          className='bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors'
        >
          Submit Project
        </Link>
      </div>

      <p className='text-xs text-gray-400 mt-6'>
        Join 2,400+ developers already building in public
      </p>
    </section>
  )
}

export default Hero
