interface TechPillProps {
  name: string
  count: number
  onClick: () => void
  isSelected: boolean
}

// Map tech names to solid dot colors
const getTechColor = (name: string) => {
  const map: Record<string, string> = {
    'Next.js': 'bg-black',
    'React': 'bg-cyan-400',
    'TypeScript': 'bg-blue-600',
    'Python': 'bg-yellow-400',
    'Tailwind CSS': 'bg-teal-500',
    'PostgreSQL': 'bg-blue-400',
    'Go': 'bg-cyan-500',
    'Flutter': 'bg-sky-400',
    'Laravel': 'bg-red-500',
    'Rust': 'bg-orange-600',
  }
  return map[name] || 'bg-gray-400'
}

const TechPill = ({ name, count, onClick, isSelected }: TechPillProps) => {
  return (
    <button
      onClick={onClick}
      className={`card-brutal px-6 py-3 rounded-xl border-2 border-dark font-bold flex items-center gap-2 shadow-brutal-sm transition-all ${
        isSelected
          ? 'bg-primary text-dark shadow-brutal-sm transform -translate-y-0.5 -translate-x-0.5'
          : 'bg-white text-dark hover:bg-pink-50'
      }`}
    >
      <span className={`w-3 h-3 rounded-full border border-dark ${getTechColor(name)}`}></span>
      {name}{' '}
      <span className='bg-gray-100 border border-dark rounded px-1.5 text-xs ml-1'>
        {count}
      </span>
    </button>
  )
}

export default TechPill
