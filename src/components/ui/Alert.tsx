'use client'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  children: React.ReactNode
  className?: string
}

const Alert = ({ variant = 'info', children, className = '' }: AlertProps) => {
  const variantStyles: Record<AlertVariant, string> = {
    info: 'bg-accentSoft text-dark',
    success: 'bg-successSoft text-dark',
    warning: 'bg-warningSoft text-dark',
    error: 'bg-dangerSoft text-dark',
  }

  return (
    <div
      className={`border-2 border-dark rounded-xl px-4 py-3 font-bold shadow-brutal-sm ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  )
}

export default Alert