interface AdminStatCardProps {
  label: string
  value: string | number
  sub?: string
  className?: string
  labelClass?: string
  valueClass?: string
  subClass?: string
}

const AdminStatCard = ({
  label,
  value,
  sub,
  className = 'bg-white',
  labelClass = 'text-gray-500',
  valueClass = '',
  subClass = 'text-gray-600',
}: AdminStatCardProps) => {
  return (
    <div
      className={`${className} border-4 border-dark rounded-2xl p-5 shadow-brutal`}
    >
      <p className={`font-bold text-sm mb-1 ${labelClass}`}>{label}</p>
      <p className={`text-4xl font-black ${valueClass}`}>{value}</p>
      {sub && <p className={`text-xs font-bold mt-2 ${subClass}`}>{sub}</p>}
    </div>
  )
}

export default AdminStatCard