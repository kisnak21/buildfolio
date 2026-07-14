interface TechPillProps {
  name: string
  count: number
  onClick: () => void
  isSelected: boolean
}

const TechPill = ({ name, count, onClick, isSelected }: TechPillProps) => {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-4 py-2 rounded-full border transition-colors ${
        isSelected
          ? 'bg-primary text-white border-primary'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600'
      }`}
    >
      {name}{' '}
      <span
        className={`ml-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}
      >
        {count}
      </span>
    </button>
  )
}

export default TechPill
