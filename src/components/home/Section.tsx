import { ArrowRightIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

interface SectionProps {
  id: string
  title: string
  subtitle: string
  viewAllHref?: string
  viewAllLabel?: string
  children: React.ReactNode
  className?: string
}

const Section = ({
  id,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  children,
  className = '',
}: SectionProps) => {
  return (
    <section id={id} className={`py-16 ${className}`}>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='flex items-center justify-between mb-10'>
          <div>
            <h2 className='text-3xl font-black mb-1'>{title}</h2>
            <p className='font-bold text-gray-700'>{subtitle}</p>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className='font-bold hover:underline decoration-2 underline-offset-4 flex items-center gap-1 text-dark'
            >
              {viewAllLabel}
              <ArrowRightIcon className='w-4 h-4' />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

export default Section
