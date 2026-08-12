'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, RocketLaunchIcon, CpuChipIcon, GlobeAltIcon, DevicePhoneMobileIcon, LockOpenIcon, PuzzlePieceIcon, CodeBracketIcon } from '@heroicons/react/24/solid'

interface Project {
  id: string
  title: string
  description: string
  category: string
  technologies: string[]
  author: string
  likes: number
  github: string
  live: string
}

interface ProjectCardProps {
  project: Project
  onLike: (id: string, likes: number) => void
  isLiked?: boolean
}

// Generate consistent background color based on category
const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    'SaaS': 'bg-secondary',
    'AI': 'bg-[#a78bfa] text-white',
    'Web App': 'bg-[#c4f0ff]',
    'Mobile App': 'bg-[#fecaca]',
    'Open Source': 'bg-[#fde047]',
    'Game': 'bg-[#4ade80]',
  }
  return map[category] || 'bg-secondary'
}

// Generate consistent icon based on category if no thumbnail
const getCategoryIcon = (category: string) => {
  const map: Record<string, React.ReactNode> = {
    'SaaS': <RocketLaunchIcon />,
    'AI': <CpuChipIcon />,
    'Web App': <GlobeAltIcon />,
    'Mobile App': <DevicePhoneMobileIcon />,
    'Open Source': <LockOpenIcon />,
    'Game': <PuzzlePieceIcon />,
  }
  return map[category] || <CodeBracketIcon />
}

const ProjectCard = ({ project, onLike, isLiked = false }: ProjectCardProps) => {
  const {
    id,
    title,
    description,
    category,
    technologies,
    author,
    likes,
    github,
    live,
  } = project

  const router = useRouter()
  const catColor = getCategoryColor(category)
  const isLightText = catColor.includes('text-white') ? 'text-white' : 'text-dark'

  return (
    <article
      onClick={() => router.push(`/projects/${id}`)}
      className='card-brutal bg-white border-4 border-dark rounded-2xl overflow-hidden flex flex-col shadow-brutal cursor-pointer'
    >
      <div className='aspect-video bg-gray-100 border-b-4 border-dark relative overflow-hidden group flex items-center justify-center'>
        {/* Thumbnail fallback to icon */}
        <div className={`w-full h-full flex items-center justify-center ${catColor.split(' ')[0]} opacity-50`}>
          <span className='text-dark w-16 h-16'>{getCategoryIcon(category)}</span>
        </div>
        
        {/* Category Tag */}
        <div className={`absolute top-3 left-3 border-2 border-dark px-2 py-1 rounded-md text-xs font-bold shadow-brutal-sm ${catColor} ${isLightText}`}>
          {category || 'Uncategorized'}
        </div>
        
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onLike(id, likes)
          }}
          className='absolute top-3 right-3 w-10 h-10 bg-white border-2 border-dark rounded-full flex items-center justify-center shadow-brutal-sm hover:bg-pink-100 transition-colors'
        >
          {isLiked ? (
            <HeartSolid className='w-5 h-5 text-primary' />
          ) : (
            <HeartOutline className='w-5 h-5 text-dark' />
          )}
        </button>
      </div>

      <div className='p-5 flex flex-col flex-1'>
        <h3 className='text-xl font-black mb-2 line-clamp-1'>{title}</h3>
        <p className='text-sm font-medium mb-4 line-clamp-2 text-gray-700'>
          {description}
        </p>
        
        {/* Tech Pills */}
        <div className='flex flex-wrap gap-2 mb-6'>
          {technologies.slice(0, 3).map((tech: string) => (
            <span
              key={tech}
              className='bg-gray-100 border-2 border-dark px-2 py-0.5 rounded-md text-xs font-bold'
            >
              {tech}
            </span>
          ))}
          {technologies.length > 3 && (
            <span className='bg-gray-100 border-2 border-dark px-2 py-0.5 rounded-md text-xs font-bold'>
              +{technologies.length - 3}
            </span>
          )}
        </div>

        {/* Footer Card */}
        <div className='mt-auto flex items-center justify-between pt-4 border-t-2 border-dark border-dashed'>
          <Link
            href={`/u/${author}`}
            onClick={(e) => e.stopPropagation()}
            className='flex items-center gap-2 hover:opacity-80 transition-opacity'
          >
            <Image
              src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${author}`}
              className='w-8 h-8 rounded-full border-2 border-dark bg-yellow-100'
              alt={author}
              width={32}
              height={32}
              unoptimized
            />
            <span className='text-sm font-bold text-dark hover:underline'>{author}</span>
          </Link>
          <div className='flex items-center gap-1 font-bold text-sm'>
            <HeartSolid className='w-5 h-5 text-primary' />
            {likes}
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
