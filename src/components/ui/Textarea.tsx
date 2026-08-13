'use client'

interface TextareaProps {
  label: string
  id: string
  name?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  error?: string
  rows?: number
}

const Textarea = ({
  label,
  id,
  name,
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
}: TextareaProps) => {
  return (
    <div className='mb-5'>
      <label htmlFor={id} className='block font-bold text-dark mb-2'>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`input-brutal w-full px-4 py-3 bg-inputBg border-2 border-dark rounded-xl font-medium transition-shadow resize-none ${
          error ? 'border-red-500 shadow-brutal-danger' : ''
        }`}
      />
      {error && <p className='text-sm font-bold text-red-600 mt-2'>{error}</p>}
    </div>
  )
}

export default Textarea