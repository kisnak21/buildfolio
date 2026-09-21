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
  describedBy?: string
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
  describedBy,
}: InputProps) => {
  const errorId = `${id}-error`
  const inputDescribedBy = [describedBy, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined

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
        aria-describedby={inputDescribedBy}
        aria-invalid={error ? true : undefined}
        className={`input-brutal w-full px-4 py-3 bg-inputBg border-2 border-dark rounded-xl font-medium transition-shadow ${
          error ? 'border-red-500 shadow-brutal-danger' : ''
        }`}
      />
      {error && (
        <p id={errorId} className='text-sm font-bold text-red-600 mt-2' role='alert'>
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
