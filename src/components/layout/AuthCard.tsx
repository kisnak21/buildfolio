'use client'

import Link from 'next/link'
import { CodeBracketIcon } from '@heroicons/react/24/solid'

interface AuthCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

const AuthCard = ({ title, subtitle, children }: AuthCardProps) => {
  return (
    <div className='w-full max-w-sm'>
      <Link href='/' className='flex items-center gap-2 mb-8 text-2xl font-black tracking-tight'>
        <div className='w-8 h-8 bg-secondary border-2 border-dark rounded-md flex items-center justify-center shadow-brutal-sm'>
          <CodeBracketIcon className='w-5 h-5 text-dark' />
        </div>
        buildfolio
      </Link>

      <div className='bg-white border-4 border-dark rounded-2xl p-8 shadow-brutal-lg relative'>
        <h1 className='text-3xl font-black text-dark mb-2'>{title}</h1>
        <p className='font-medium text-gray-600 mb-8'>{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

export default AuthCard
