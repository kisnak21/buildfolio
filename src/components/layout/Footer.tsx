import Link from 'next/link'

const footerLinks = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

const Footer = () => {
  return (
    <footer className='border-t border-gray-200 py-10 bg-white'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
          <div className='flex items-center gap-2'>
            <div className='w-6 h-6 bg-primary rounded-md flex items-center justify-center'>
              <svg width='12' height='12' viewBox='0 0 14 14' fill='none'>
                <rect x='1' y='1' width='5' height='5' rx='1' fill='white' />
                <rect
                  x='8'
                  y='1'
                  width='5'
                  height='5'
                  rx='1'
                  fill='white'
                  opacity='0.6'
                />
                <rect
                  x='1'
                  y='8'
                  width='5'
                  height='5'
                  rx='1'
                  fill='white'
                  opacity='0.6'
                />
                <rect
                  x='8'
                  y='8'
                  width='5'
                  height='5'
                  rx='1'
                  fill='white'
                  opacity='0.3'
                />
              </svg>
            </div>
            <span className='text-sm text-gray-500'>
              © {new Date().getFullYear()} Buildfolio. All rights reserved.
            </span>
          </div>
          <nav className='flex items-center gap-6 flex-wrap justify-center'>
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className='text-sm text-gray-500 hover:text-gray-900 transition-colors'
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
