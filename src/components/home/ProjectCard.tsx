'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCategoryColor, isCategoryLightText } from '@/lib/categoryColors'
import { shareProject } from '@/lib/shareProject'
import {
  BookmarkIcon as BookmarkOutline,
  HeartIcon as HeartOutline,
  ShareIcon,
} from '@heroicons/react/24/outline'
import {
  BookmarkIcon as BookmarkSolid,
  HeartIcon as HeartSolid,
  RocketLaunchIcon,
  CpuChipIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  LockOpenIcon,
  PuzzlePieceIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/solid'

interface Project {
  id: string | number
  title: string
  description: string
  category: string
  technologies: string[]
  author: string
  authorUsername?: string
  likes: number
  github: string
  live: string
  thumbnail?: string | null
}

interface ProjectCardProps {
  project: Project
  onLike: (id: string, likes: number) => void
  isLiked?: boolean
  isBookmarked?: boolean
  bookmarkPending?: boolean
  onBookmark?: (id: string) => void
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

const ProjectCard = ({
  project,
  onLike,
  isLiked = false,
  isBookmarked = false,
  bookmarkPending = false,
  onBookmark,
}: ProjectCardProps) => {
  const {
    id,
    title,
    description,
    category,
    technologies,
    author,
    likes,
    thumbnail,
  } = project

  const router = useRouter()
  const [shareStatus, setShareStatus] = useState('')
  const catColor = getCategoryColor(category)
  const handleShare = async () => {
    try {
      const result = await shareProject({
        title,
        description,
        url: `${window.location.origin}/projects/${id}`,
      })
      setShareStatus(result === 'copied' ? 'Link copied' : 'Shared')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setShareStatus('Share failed')
    }
    window.setTimeout(() => setShareStatus(''), 2_000)
  }
  const isLightText = isCategoryLightText(category) ? 'text-white' : 'text-dark'

  return (
    <article
      onClick={() => router.push(`/projects/${id}`)}
      className='card-brutal bg-white border-4 border-dark rounded-2xl overflow-hidden flex flex-col shadow-brutal cursor-pointer'
    >
      <div className='aspect-video bg-gray-100 border-b-4 border-dark relative overflow-hidden group flex items-center justify-center'>
        {/* Thumbnail fallback to icon */}
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='object-cover group-hover:scale-105 transition-transform duration-300'
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${catColor.split(' ')[0]} opacity-50`}>
            <span className='text-dark w-16 h-16'>{getCategoryIcon(category)}</span>
          </div>
        )}
        
        {/* Category Tag */}
        <div className={`absolute top-3 left-3 border-2 border-dark px-2 py-1 rounded-md text-xs font-bold shadow-brutal-sm ${catColor} ${isLightText}`}>
          {category || 'Uncategorized'}
        </div>
        
        {onBookmark && (
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation()
              onBookmark(String(id))
            }}
            disabled={bookmarkPending}
            aria-label={
              isBookmarked ? `Remove ${title} from bookmarks` : `Bookmark ${title}`
            }
            aria-pressed={isBookmarked}
            className='absolute right-14 top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-dark bg-white shadow-brutal-sm transition-colors hover:bg-yellow-100 disabled:cursor-wait disabled:opacity-60'
          >
            {isBookmarked ? (
              <BookmarkSolid className='h-5 w-5 text-dark' />
            ) : (
              <BookmarkOutline className='h-5 w-5 text-dark' />
            )}
          </button>
        )}
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onLike(String(id), likes)
          }}
          aria-label={isLiked ? `Unlike ${title}` : `Like ${title}`}
          aria-pressed={isLiked}
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
            href={`/u/${encodeURIComponent(project.authorUsername || author)}`}
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
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                void handleShare()
              }}
              aria-label={`Share ${title}`}
              className='flex min-h-10 items-center gap-1 rounded-lg border-2 border-dark bg-white px-2 font-bold text-sm shadow-brutal-sm hover:bg-secondary'
            >
              <ShareIcon className='h-4 w-4' aria-hidden />
              <span>{shareStatus || 'Share'}</span>
            </button>
            <div className='flex items-center gap-1 font-bold text-sm'>
              <HeartSolid className='w-5 h-5 text-primary' />
              {likes}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
