interface CategoryCardProps {
  icon: React.ReactNode
  name: string
  count: number
  onClick: () => void
  isSelected: boolean
}

const CategoryCard = ({ icon, name, count, onClick, isSelected }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`card-brutal group w-full border-4 border-dark rounded-2xl p-4 text-center transition-all shadow-brutal-sm ${
        isSelected
          ? 'bg-[#c4f0ff] shadow-[4px_4px_0px_0px_#111111] transform -translate-y-1 -translate-x-1'
          : 'bg-white hover:bg-yellow-50'
      }`}
    >
      <div className='w-10 h-10 mx-auto mb-2 text-dark'>{icon}</div>
      <p className='text-base font-black text-dark'>
        {name}
      </p>
      <p className='text-xs font-bold text-gray-600 mt-1'>{count} projects</p>
    </button>
  )
}

export default CategoryCard
