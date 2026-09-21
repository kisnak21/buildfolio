import type { CSSProperties } from 'react'

interface SkeletonBlockProps {
  className?: string
  style?: CSSProperties
}

const SkeletonBlock = ({ className = '', style }: SkeletonBlockProps) => (
  <div
    aria-hidden='true'
    className={`rounded-md border-2 border-dark bg-gray-200 ${className}`}
    style={style}
  />
)

export default SkeletonBlock
