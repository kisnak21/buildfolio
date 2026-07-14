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
    <div className='mb-4'>
      <div className='flex items-center justify-between mb-1.5'>
        <label htmlFor={id} className='block text-xs text-gray-600'>
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
        className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
          error ? 'border-red-500' : 'border-gray-200 focus:border-primary'
        }`}
      />
      {error && <p className='text-xs text-red-500 mt-1.5'>{error}</p>}
    </div>
  )
}

export default Input
