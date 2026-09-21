import Link from 'next/link'

interface CategoryCardProps {
  icon: React.ReactNode
  name: string
  count: number
  href: string
  isSelected?: boolean
}

const CategoryCard = ({
  icon,
  name,
  count,
  href,
  isSelected = false,
}: CategoryCardProps) => {
  return (
    <Link
      href={href}
      aria-current={isSelected ? 'page' : undefined}
      className={`card-brutal group block min-h-11 w-full rounded-2xl border-4 border-dark p-4 text-center shadow-brutal-sm transition-all ${
        isSelected
          ? 'bg-accentSoft shadow-brutal transform -translate-y-1 -translate-x-1'
          : 'bg-white hover:bg-yellow-50'
      }`}
    >
      <div className='w-10 h-10 mx-auto mb-2 text-dark'>{icon}</div>
      <p className='text-base font-black text-dark'>
        {name}
      </p>
      <p className='text-xs font-bold text-gray-600 mt-1'>{count} projects</p>
    </Link>
  )
}

export default CategoryCard
