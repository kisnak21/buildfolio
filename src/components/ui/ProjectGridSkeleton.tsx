import ProjectCardSkeleton from './ProjectCardSkeleton'

interface ProjectGridSkeletonProps {
  count?: number
  showBookmark?: boolean
  className?: string
  label?: string
}

const ProjectGridSkeleton = ({
  count = 3,
  showBookmark = true,
  className = 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3',
  label = 'Loading projects',
}: ProjectGridSkeletonProps) => (
  <div
    role='status'
    aria-busy='true'
    aria-live='polite'
    className={className}
  >
    <span className='sr-only'>{label}</span>
    {Array.from({ length: count }, (_, index) => (
      <ProjectCardSkeleton key={index} showBookmark={showBookmark} />
    ))}
  </div>
)

export default ProjectGridSkeleton
