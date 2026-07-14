'use client'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!open) return null

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4'>
      <div className='bg-white rounded-xl p-6 w-full max-w-sm'>
        <h3 className='text-base font-semibold text-gray-900 mb-1'>{title}</h3>
        <p className='text-sm text-gray-500 mb-6'>{message}</p>
        <div className='flex items-center justify-end gap-3'>
          <button
            onClick={onCancel}
            className='text-sm text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
