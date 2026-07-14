interface CategoryCardProps {
  icon: string
  name: string
  count: number
  onClick: () => void
  isSelected: boolean
}

const CategoryCard = ({ icon, name, count, onClick, isSelected }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`group w-full border rounded-xl p-4 text-center transition-all ${
        isSelected
          ? 'bg-blue-50 border-primary shadow-sm'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className='text-2xl mb-2'>{icon}</div>
      <p
        className={`text-sm font-medium transition-colors ${
          isSelected
            ? 'text-primary'
            : 'text-gray-700 group-hover:text-gray-900'
        }`}
      >
        {name}
      </p>
      <p className='text-xs text-gray-400 mt-0.5'>{count} projects</p>
    </button>
  )
}

export default CategoryCard
