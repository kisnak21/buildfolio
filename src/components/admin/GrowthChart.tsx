'use client'

interface GrowthChartProps {
  series: {
    label: string
    colorClass: string
    values: number[]
  }[]
  dates: string[]
}

const WIDTH = 640
const HEIGHT = 210
const PAD = { top: 16, right: 12, bottom: 28, left: 36 }

const formatAxis = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const GrowthChart = ({ series, dates }: GrowthChartProps) => {
  const maxValue = Math.max(1, ...series.flatMap((s) => s.values))
  const chartW = WIDTH - PAD.left - PAD.right
  const chartH = HEIGHT - PAD.top - PAD.bottom
  const stepX = dates.length > 1 ? chartW / (dates.length - 1) : chartW

  const ticks = [0, 1, 2, 3].map((i) => Math.round((maxValue * i) / 3))
  const x = (i: number) => PAD.left + i * stepX
  const y = (v: number) => PAD.top + chartH - (v / maxValue) * chartH

  const pathFor = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
      .join(' ')

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className='w-full h-auto'
      role='img'
      aria-label='Cumulative growth chart'
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(tick)}
            y2={y(tick)}
            className='stroke-dark/10'
            strokeDasharray='4 4'
          />
          <text
            x={PAD.left - 6}
            y={y(tick) + 3}
            textAnchor='end'
            className='fill-gray-500 text-[10px] font-bold'
          >
            {tick}
          </text>
        </g>
      ))}

      {series.map((s) => {
        const areaPath = `${pathFor(s.values)} L ${x(s.values.length - 1).toFixed(1)} ${
          HEIGHT - PAD.bottom
        } L ${PAD.left} ${HEIGHT - PAD.bottom} Z`
        return (
          <g key={s.label}>
            <path d={areaPath} className='fill-dark/5' />
            <path
              d={pathFor(s.values)}
              fill='none'
              strokeWidth={3}
              strokeLinecap='round'
              strokeLinejoin='round'
              className={`${s.colorClass} stroke-dark`}
            />
          </g>
        )
      })}

      {dates.map((date, i) =>
        i % Math.ceil(dates.length / 7) === 0 || i === dates.length - 1 ? (
          <text
            key={date}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor='middle'
            className='fill-gray-500 text-[10px] font-bold'
          >
            {formatAxis(date)}
          </text>
        ) : null,
      )}
    </svg>
  )
}

export default GrowthChart