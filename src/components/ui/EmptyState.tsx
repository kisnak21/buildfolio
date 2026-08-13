'use client'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <div className='bg-white border-4 border-dark rounded-2xl p-12 text-center shadow-brutal'>
      <p className='text-lg font-bold text-gray-700 mb-2'>{title}</p>
      {description && (
        <p className='text-gray-600 font-medium mb-6'>{description}</p>
      )}
      {action && <div className='flex justify-center'>{action}</div>}
    </div>
  )
}

export default EmptyState