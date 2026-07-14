interface SectionProps {
  id: string
  title: string
  subtitle: string
  viewAllHref?: string
  children: React.ReactNode
}

const Section = ({ id, title, subtitle, viewAllHref, children }: SectionProps) => {
  return (
    <section id={id} className='border-t border-gray-200 py-20'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='flex items-center justify-between mb-10'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900 mb-1'>{title}</h2>
            <p className='text-sm text-gray-500'>{subtitle}</p>
          </div>
          {viewAllHref && (
            <a
              href={viewAllHref}
              className='text-sm text-primary hover:text-primary-hover transition-colors'
            >
              View all →
            </a>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

export default Section