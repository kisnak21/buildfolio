'use client'

interface CheckboxProps {
  id: string
  label: React.ReactNode
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
}

const Checkbox = ({ id, label, checked, onChange, error }: CheckboxProps) => {
  return (
    <div className='mb-1'>
      <div className='flex items-start gap-2'>
        <input
          type='checkbox'
          id={id}
          checked={checked}
          onChange={onChange}
          className='w-4 h-4 mt-0.5 rounded border-gray-300 bg-white accent-primary cursor-pointer shrink-0'
        />
        <label
          htmlFor={id}
          className='text-xs text-gray-600 cursor-pointer leading-relaxed'
        >
          {label}
        </label>
      </div>
      {error && <p className='text-xs text-red-500 mt-1.5'>{error}</p>}
    </div>
  )
}

export default Checkbox
