'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  type AdminUser,
} from '@/lib/api/adminApi'

const UsersClient = () => {
  const dispatch = useAppDispatch()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      const result = await getAdminUsers()
      setUsers(result.data)
      setTotal(result.pagination.total)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getAdminUsers()
      .then((result) => {
        if (cancelled) return
        setUsers(result.data)
        setTotal(result.pagination.total)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load users')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  const toggleVerify = async (user: AdminUser) => {
    setBusyId(user.id)
    try {
      await updateAdminUser(user.id, { verified: !user.verified })
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, verified: !u.verified } : u,
        ),
      )
      dispatch(
        showToast({
          message: `${user.name} marked ${user.verified ? 'unverified' : 'verified'}`,
          type: 'success',
        }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Update failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
    }
  }

  const toggleRole = async (user: AdminUser) => {
    setBusyId(user.id)
    try {
      const promote = user.role === 'USER'
      await updateAdminUser(user.id, { role: promote ? 'admin' : 'user' })
      setUsers(
        users.map((u) =>
          u.id === user.id
            ? { ...u, role: promote ? 'ADMIN' : 'USER' }
            : u,
        ),
      )
      dispatch(
        showToast({
          message: `${user.name} ${promote ? 'promoted to admin' : 'demoted to user'}`,
          type: 'success',
        }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Update failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!confirmUser) return
    setBusyId(confirmUser.id)
    try {
      await deleteAdminUser(confirmUser.id)
      setUsers(users.filter((u) => u.id !== confirmUser.id))
      setTotal((t) => t - 1)
      dispatch(
        showToast({
          message: `${confirmUser.name} deleted`,
          type: 'success',
        }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Delete failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
      setConfirmUser(null)
    }
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

      {error && !loading && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <p className='font-bold text-sm'>{error}</p>
          <button
            onClick={() => {
              setError('')
              setLoading(true)
              void load()
            }}
            className={`${buttonClass('primary', 'sm', '')} shrink-0`}
          >
            Retry
          </button>
        </div>
      )}

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
              {loading ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-500'>
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-500'>
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
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
                        disabled={busyId === user.id}
                        onClick={() => toggleRole(user)}
                        className={`${actionBtn(user.role === 'ADMIN' ? 'white' : 'primary')} ${
                          busyId === user.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                      </button>
                      {user.role !== 'ADMIN' && (
                        <>
                          {!user.verified && (
                            <button
                              disabled={busyId === user.id}
                              onClick={() => toggleVerify(user)}
                              className={`${actionBtn('white')} ml-2 ${
                                busyId === user.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              Verify
                            </button>
                          )}
                          <button
                            disabled={busyId === user.id}
                            onClick={() => setConfirmUser(user)}
                            className={`${actionBtn('danger')} ml-2 ${
                              busyId === user.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='p-4 border-t-4 border-dark flex items-center justify-between'>
          <p className='text-sm font-bold text-gray-500'>
            Showing {filtered.length} of {total} users
          </p>
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