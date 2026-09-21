import SkeletonBlock from './SkeletonBlock'

interface DataTableSkeletonProps {
  headers: string[]
  label: string
  rowCount?: number
  headerClassName?: string
  minWidthClassName?: string
  columnWidths?: string[]
  className?: string
}

interface DataTableSkeletonRowsProps {
  columns: number
  label: string
  rowCount?: number
  columnWidths?: string[]
}

export const DataTableSkeletonRows = ({
  columns,
  label,
  rowCount = 4,
  columnWidths = [],
}: DataTableSkeletonRowsProps) => (
  <>
    {Array.from({ length: rowCount }, (_, rowIndex) => (
      <tr
        key={rowIndex}
        className='skeleton-loading border-b-2 border-dashed border-dark last:border-b-0'
      >
        {Array.from({ length: columns }, (_, columnIndex) => (
          <td key={columnIndex} className='p-4'>
            {rowIndex === 0 && columnIndex === 0 && (
              <span role='status' className='sr-only'>
                {label}
              </span>
            )}
            <SkeletonBlock
              className={`h-5 ${columnWidths[columnIndex] ?? 'w-24'}`}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
)

const DataTableSkeleton = ({
  headers,
  label,
  rowCount = 4,
  headerClassName = 'bg-gray-100',
  minWidthClassName = 'min-w-[680px]',
  columnWidths,
  className = '',
}: DataTableSkeletonProps) => (
  <div
    aria-busy='true'
    className={`overflow-hidden rounded-2xl border-4 border-dark bg-white shadow-brutal ${className}`}
  >
    <div className='overflow-x-auto'>
      <table
        aria-label={label}
        className={`w-full border-collapse text-left ${minWidthClassName}`}
      >
        <thead className={`${headerClassName} border-b-4 border-dark`}>
          <tr>
            {headers.map((header) => (
              <th key={header} className='p-4 font-black'>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <DataTableSkeletonRows
            columns={headers.length}
            label={label}
            rowCount={rowCount}
            columnWidths={columnWidths}
          />
        </tbody>
      </table>
    </div>
  </div>
)

export default DataTableSkeleton
