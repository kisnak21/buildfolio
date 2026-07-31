interface DividerProps {
  text?: string
}

const Divider = ({ text = 'or' }: DividerProps) => {
  return (
    <div className='flex items-center gap-4 my-8'>
      <div className='flex-1 border-t-2 border-dark border-dashed'></div>
      <span className='font-bold text-dark bg-secondary px-3 py-1 rounded-full border-2 border-dark text-sm shadow-brutal-sm transform -rotate-2'>
        {text}
      </span>
      <div className='flex-1 border-t-2 border-dark border-dashed'></div>
    </div>
  )
}

export default Divider
