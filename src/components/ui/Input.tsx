'use client'

interface InputProps {
  label: string
  type?: string
  id: string
  name?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  rightElement?: React.ReactNode
}

const Input = ({
  label,
  type = 'text',
  id,
  name,
  placeholder,
  value,
  onChange,
  error,
  rightElement,
}: InputProps) => {
  return (
    <div className='mb-5'>
      <div className='flex items-center justify-between mb-2'>
        <label htmlFor={id} className='block font-bold text-dark'>
          {label}
        </label>
        {rightElement}
      </div>
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-brutal w-full px-4 py-3 bg-[#f3f4f6] border-2 border-dark rounded-xl font-medium transition-shadow ${
          error ? 'border-red-500 shadow-[4px_4px_0px_0px_#ef4444]' : ''
        }`}
      />
      {error && <p className='text-sm font-bold text-red-600 mt-2'>{error}</p>}
    </div>
  )
}

export default Input
