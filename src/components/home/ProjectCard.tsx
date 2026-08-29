'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCategoryColor, isCategoryLightText } from '@/lib/categoryColors'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid, RocketLaunchIcon, CpuChipIcon, GlobeAltIcon, DevicePhoneMobileIcon, LockOpenIcon, PuzzlePieceIcon, CodeBracketIcon } from '@heroicons/react/24/solid'
import ShareButton from '@/components/ui/ShareButton'

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
  onBookmark?: (id: string) => void
  isLiked?: boolean
  isBookmarked?: boolean
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
  onBookmark,
  isLiked = false,
  isBookmarked = false,
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
  const catColor = getCategoryColor(category)
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
        
        {/* Like Button */}
        <div className='absolute top-3 right-3 flex gap-2'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              onLike(String(id), likes)
            }}
            aria-label={isLiked ? `Unlike ${title}` : `Like ${title}`}
            aria-pressed={isLiked}
            className='inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-dark bg-white shadow-brutal-sm transition-colors hover:bg-pink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark'
          >
            {isLiked ? (
              <HeartSolid className='w-5 h-5 text-primary' />
            ) : (
              <HeartOutline className='w-5 h-5 text-dark' />
            )}
          </button>
          {onBookmark && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onBookmark(String(id))
              }}
              aria-label={isBookmarked ? `Remove ${title} bookmark` : `Bookmark ${title}`}
              aria-pressed={isBookmarked}
              className='inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-dark bg-white shadow-brutal-sm transition-colors hover:bg-yellow-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark'
            >
              {isBookmarked ? (
                <BookmarkSolid className='w-5 h-5 text-dark' />
              ) : (
                <BookmarkOutline className='w-5 h-5 text-dark' />
              )}
            </button>
          )}
          <ShareButton
            compact
            url={`/projects/${id}`}
            title={title}
            text={description}
            className='rounded-xl'
          />
        </div>
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
