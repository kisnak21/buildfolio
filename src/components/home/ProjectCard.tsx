'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
}

const ProjectCard = ({ project, onLike }: ProjectCardProps) => {
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

  return (
    <div
      onClick={() => router.push(`/projects/${id}`)}
      className='group bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-5 flex flex-col gap-4 transition-all cursor-pointer'
    >
      <div className='flex items-start justify-between'>
        <span className='text-xs bg-blue-50 text-primary border border-blue-100 px-2 py-0.5 rounded-md font-medium'>
          {project.category}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onLike(id, likes)
          }}
          className='flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
          </svg>
          <span className='text-xs'>{likes}</span>
        </button>
      </div>

      <div>
        <h3 className='text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors'>
          {title}
        </h3>
        <p className='text-xs text-gray-500 leading-relaxed line-clamp-2'>
          {description}
        </p>
      </div>

      <div className='flex flex-wrap gap-1'>
        {technologies.map((tech: string) => (
          <span
            key={tech}
            className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded'
          >
            {tech}
          </span>
        ))}
      </div>

      <div className='flex items-center justify-between pt-1 border-t border-gray-100'>
        <Link
          href={`/u/${author}`}
          onClick={(e) => e.stopPropagation()}
          className='flex items-center gap-2 hover:opacity-80 transition-opacity'
        >
          <img
            src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${author}`}
            className='w-6 h-6 rounded-full border border-gray-200'
            alt={author}
          />
          <span className='text-xs text-gray-500 hover:text-gray-900 transition-colors'>
            {author}
          </span>
        </Link>
        <div className='flex items-center gap-2'>
          <a
            href={github}
            onClick={(e) => e.stopPropagation()}
            className='text-xs text-gray-400 hover:text-gray-700 transition-colors'
          >
            GitHub
          </a>
          <a
            href={live}
            onClick={(e) => e.stopPropagation()}
            className='text-xs text-primary hover:text-primary-hover transition-colors'
          >
            Live →
          </a>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
