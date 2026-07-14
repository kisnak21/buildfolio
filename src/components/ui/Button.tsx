'use client'

interface ButtonProps {
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
}

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
}: ButtonProps) => {
  const baseStyles = 'text-sm font-medium rounded-lg py-2.5 transition-colors'

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    secondary:
      'bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700',
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  )
}

export default Button
