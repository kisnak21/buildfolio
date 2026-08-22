interface AdminPaginationProps {
  page: number
  totalPages: number
  total: number
  label: string
  onPageChange: (page: number) => void
}

const AdminPagination = ({
  page,
  totalPages,
  total,
  label,
  onPageChange,
}: AdminPaginationProps) => {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t-4 border-dark'>
      <p className='text-sm font-bold text-gray-600'>
        Page {page} of {Math.max(totalPages, 1)} · {total} {label}
      </p>
      <div className='flex gap-2'>
        <button
          type='button'
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className='min-h-11 px-4 border-2 border-dark rounded-lg bg-white font-black shadow-brutal-sm disabled:opacity-40 disabled:shadow-none'
        >
          Previous
        </button>
        <button
          type='button'
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className='min-h-11 px-4 border-2 border-dark rounded-lg bg-secondary font-black shadow-brutal-sm disabled:opacity-40 disabled:shadow-none'
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default AdminPagination
