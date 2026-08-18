'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { buttonClass } from '@/components/ui/buttonClass'
import { adminUsers, type AdminUser } from '@/lib/adminMockData'

const UsersClient = () => {
  const dispatch = useAppDispatch()
  const [users, setUsers] = useState(adminUsers)
  const [query, setQuery] = useState('')
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    )
  }, [users, query])

  const toggleVerify = (id: string) => {
    const user = users.find((u) => u.id === id)
    setUsers(
      users.map((u) => (u.id === id ? { ...u, verified: !u.verified } : u)),
    )
    dispatch(
      showToast({
        message: `${user?.name} marked ${user?.verified ? 'unverified' : 'verified'}`,
        type: 'success',
      }),
    )
  }

  const toggleRole = (id: string) => {
    const user = users.find((u) => u.id === id)
    const promote = user?.role === 'USER'
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, role: promote ? 'ADMIN' : 'USER' } : u,
      ),
    )
    dispatch(
      showToast({
        message: `${user?.name} ${promote ? 'promoted to admin' : 'demoted to user'}`,
        type: 'success',
      }),
    )
  }

  const handleDelete = () => {
    if (!confirmUser) return
    setUsers(users.filter((u) => u.id !== confirmUser.id))
    dispatch(
      showToast({
        message: `${confirmUser.name} deleted`,
        type: 'success',
      }),
    )
    setConfirmUser(null)
  }

  const actionBtn = (variant: 'white' | 'primary' | 'danger') =>
    `${buttonClass('ghost', 'sm', '')} ${
      variant === 'primary'
        ? 'bg-primary hover:bg-primaryDark hover:text-white'
        : variant === 'danger'
          ? 'bg-dangerSoft hover:bg-danger hover:text-white'
          : 'bg-white hover:bg-inputBg'
    }`.replace('border-transparent shadow-none', 'border-2 shadow-brutal-sm')

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Users</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Manage accounts, roles, and verification.
          </p>
        </div>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search name or email...'
          className='w-full md:w-64 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary'
        />
      </div>

      <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[720px]'>
            <thead className='bg-gray-100 border-b-4 border-dark'>
              <tr>
                <th className='p-4 font-black'>User</th>
                <th className='p-4 font-black'>Email</th>
                <th className='p-4 font-black'>Status</th>
                <th className='p-4 font-black'>Role</th>
                <th className='p-4 font-black'>Projects</th>
                <th className='p-4 font-black text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className='border-b-2 border-dark border-dashed hover:bg-yellow-50 transition-colors'
                >
                  <td className='p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 rounded-full border-2 border-dark bg-purpleSoft overflow-hidden shrink-0'>
                        <Image
                          src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.username}`}
                          alt={user.name}
                          width={36}
                          height={36}
                          unoptimized
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div className='leading-tight'>
                        <p className='font-black'>{user.name}</p>
                        <p className='text-xs font-bold text-gray-500'>
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className='p-4 font-bold'>{user.email}</td>
                  <td className='p-4'>
                    <span
                      className={`border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black shadow-brutal-sm ${
                        user.verified ? 'bg-successSoft' : 'bg-warningSoft'
                      }`}
                    >
                      {user.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className='p-4'>
                    <span
                      className={`border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black shadow-brutal-sm ${
                        user.role === 'ADMIN' ? 'bg-primary' : 'bg-white'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'ADMIN' : 'User'}
                    </span>
                  </td>
                  <td className='p-4 font-bold'>{user.projects}</td>
                  <td className='p-4 text-right whitespace-nowrap'>
                    <button
                      onClick={() =>
                        dispatch(
                          showToast({
                            message: 'Detail user menyusul di fase backend',
                            type: 'info',
                          }),
                        )
                      }
                      className={actionBtn('white')}
                    >
                      View
                    </button>
                    <button
                      onClick={() => toggleRole(user.id)}
                      className={`${actionBtn(user.role === 'ADMIN' ? 'white' : 'primary')} ml-2`}
                    >
                      {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                    </button>
                    {user.role !== 'ADMIN' && (
                      <>
                        {!user.verified && (
                          <button
                            onClick={() => toggleVerify(user.id)}
                            className={`${actionBtn('white')} ml-2`}
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmUser(user)}
                          className={`${actionBtn('danger')} ml-2`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='p-4 border-t-4 border-dark flex items-center justify-between'>
          <p className='text-sm font-bold text-gray-500'>
            Showing {filtered.length} of {users.length} users
          </p>
          <div className='flex gap-2'>
            <button
              disabled
              className='bg-white border-2 border-dark px-3 py-1.5 rounded-lg text-xs font-bold shadow-brutal-sm opacity-50 cursor-not-allowed'
            >
              Prev
            </button>
            <button
              onClick={() =>
                dispatch(
                  showToast({
                    message: 'Pagination backend menyusul',
                    type: 'info',
                  }),
                )
              }
              className='bg-secondary border-2 border-dark px-3 py-1.5 rounded-lg text-xs font-bold shadow-brutal-sm hover:bg-warningSoft transition-colors'
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmUser}
        title='Delete user?'
        message={`This action cannot be undone. All data related to ${confirmUser?.name} will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  )
}

export default UsersClient