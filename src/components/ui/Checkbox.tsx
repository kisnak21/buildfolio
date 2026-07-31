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
    <div className='mb-2'>
      <div className='flex items-start gap-3'>
        <input
          type='checkbox'
          id={id}
          checked={checked}
          onChange={onChange}
          className='w-5 h-5 mt-0.5 rounded-md border-2 border-dark bg-white accent-primary cursor-pointer shrink-0'
        />
        <label
          htmlFor={id}
          className='font-bold text-dark cursor-pointer leading-relaxed'
        >
          {label}
        </label>
      </div>
      {error && <p className='text-sm font-bold text-red-500 mt-2'>{error}</p>}
    </div>
  )
}

export default Checkbox
