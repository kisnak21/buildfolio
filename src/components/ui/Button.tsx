'use client'

interface ButtonProps {
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
}: ButtonProps) => {
  const baseStyles = 'btn-brutal font-bold border-2 border-dark py-3 px-6 rounded-xl shadow-brutal flex justify-center items-center gap-2'

  const variantStyles = {
    primary: 'bg-primary text-dark hover:bg-pink-400',
    secondary: 'bg-white text-dark hover:bg-gray-50',
    accent: 'bg-accent text-white hover:bg-accentDark',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'border-transparent shadow-none hover:bg-gray-100 hover:shadow-brutal-sm hover:border-dark',
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
