import Link from 'next/link'
import { CodeBracketIcon } from '@heroicons/react/24/solid'

const footerLinks = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

const Footer = () => {
  return (
    <footer className='bg-dark text-white border-t-4 border-dark py-12 mt-auto'>
      <div className='max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6'>
        <Link href='/' className='text-xl font-black flex items-center gap-2'>
          <div className='w-6 h-6 bg-primary border-2 border-white rounded-md flex items-center justify-center'>
            <CodeBracketIcon className='w-4 h-4 text-dark' />
          </div>
          buildfolio
        </Link>

        <nav className='flex gap-6 font-bold text-sm flex-wrap justify-center'>
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className='hover:text-primary transition-colors'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className='font-medium text-sm text-gray-400'>
          © {new Date().getFullYear()} Buildfolio.
        </p>
      </div>
    </footer>
  )
}

export default Footer
