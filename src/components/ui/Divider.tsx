interface DividerProps {
  text?: string
}

const Divider = ({ text = 'or' }: DividerProps) => {
  return (
    <div className='flex items-center gap-3 my-6'>
      <div className='flex-1 h-px bg-gray-200'></div>
      <span className='text-xs text-gray-400'>{text}</span>
      <div className='flex-1 h-px bg-gray-200'></div>
    </div>
  )
}

export default Divider
