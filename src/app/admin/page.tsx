import Link from 'next/link'
import Image from 'next/image'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { buttonClass } from '@/components/ui/buttonClass'
import { chartBars, chartLabels, recentSignups } from '@/lib/adminMockData'

const statCards = [
  {
    label: 'Users',
    value: '23',
    sub: '+3 this week',
    className: 'bg-primary',
    subClass: 'text-gray-700',
  },
  {
    label: 'Projects',
    value: '37',
    sub: '+5 this week',
    className: 'bg-accentSoft',
    subClass: 'text-gray-700',
  },
  {
    label: 'Comments',
    value: '89',
    sub: '+12 this week',
    className: 'bg-successSoft',
    subClass: 'text-gray-700',
  },
  {
    label: 'Likes',
    value: '1,204',
    sub: '+148 this week',
    className: 'bg-purpleSoft',
    labelClass: 'text-white',
    valueClass: 'text-white',
    subClass: 'text-white/80',
  },
  {
    label: 'Bookmarks',
    value: '156',
    sub: '+22 this week',
    className: 'bg-white',
    subClass: 'text-gray-600',
  },
]

const OverviewPage = () => {
  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Overview</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Platform health at a glance.
          </p>
        </div>
        <span className='font-bold bg-successSoft border-2 border-dark px-3 py-1.5 rounded-lg shadow-brutal-sm text-sm flex items-center gap-2 w-fit'>
          <span className='w-2.5 h-2.5 bg-greenMid border-2 border-dark rounded-full' />
          All systems operational
        </span>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-10'>
        {statCards.map((card) => (
          <AdminStatCard key={card.label} {...card} />
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-black'>New signups — last 14 days</h2>
            <div className='flex gap-2'>
              <span className='btn-brutal bg-primary border-2 border-dark px-3 py-1 rounded-lg text-xs font-bold shadow-brutal-sm'>
                14d
              </span>
              <span className='btn-brutal bg-white border-2 border-dark px-3 py-1 rounded-lg text-xs font-bold shadow-brutal-sm opacity-50 cursor-not-allowed'>
                30d
              </span>
            </div>
          </div>
          <div className='flex items-end gap-2 h-44'>
            {chartBars.map((height, i) => (
              <div
                key={i}
                className={`bar flex-1 border-2 border-dark rounded-t-md transition-all ${
                  i === 6
                    ? 'bg-primary'
                    : i === chartBars.length - 1
                      ? 'bg-secondary'
                      : 'bg-accentSoft'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className='flex gap-2 mt-2'>
            {chartLabels.map((label) => (
              <span
                key={label}
                className='flex-1 text-center text-[10px] font-bold text-gray-400'
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
          <h2 className='text-xl font-black mb-4'>Recent signups</h2>
          <div className='space-y-4'>
            {recentSignups.map((signup) => (
              <div key={signup.id} className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-full border-2 border-dark bg-successSoft overflow-hidden shrink-0'>
                  <Image
                    src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${signup.seed}`}
                    alt={signup.name}
                    width={36}
                    height={36}
                    unoptimized
                    className='w-full h-full object-cover'
                  />
                </div>
                <div className='leading-tight min-w-0'>
                  <p className='font-black text-sm truncate'>{signup.name}</p>
                  <p className='text-xs font-bold text-gray-500 truncate'>
                    @{signup.username} · {signup.time}
                  </p>
                </div>
                {signup.isNew && (
                  <span className='ml-auto text-xs font-black bg-warningSoft border-2 border-dark px-2 py-0.5 rounded shadow-brutal-sm'>
                    NEW
                  </span>
                )}
              </div>
            ))}
          </div>
          <Link
            href='/admin/users'
            className={`${buttonClass('secondary', 'md', 'w-full mt-5')}`}
          >
            View all users
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OverviewPage