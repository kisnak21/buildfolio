'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ModerationDialog from '@/components/admin/ModerationDialog'
import AdminPagination from '@/components/admin/AdminPagination'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  deleteAdminUser,
  getAdminUsers,
  moderateAdminUser,
  updateAdminUser,
  type AdminUser,
  type ListResponse,
} from '@/lib/api/adminApi'

const emptyPagination: ListResponse<AdminUser>['pagination'] = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

const UsersClient = () => {
  const dispatch = useAppDispatch()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null)
  const [moderation, setModeration] = useState<{
    user: AdminUser
    action: 'ban' | 'suspend'
  } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAdminUsers({
      page,
      limit: 20,
      search: deferredQuery.trim() || undefined,
      status: status || undefined,
    })
      .then((result) => {
        if (cancelled) return
        setUsers(result.data)
        setPagination(result.pagination)
        setError('')
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load users')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [deferredQuery, page, status])

  const refresh = async () => {
    setLoading(true)
    try {
      const result = await getAdminUsers({
        page,
        limit: 20,
        search: deferredQuery.trim() || undefined,
        status: status || undefined,
      })
      setUsers(result.data)
      setPagination(result.pagination)
      setError('')
      return result
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const refreshAfterMutation = async () => {
    const result = await refresh()
    if (result?.data.length === 0 && result.pagination.total > 0 && page > 1) {
      setPage((current) => current - 1)
    }
  }

  const updateRow = (updated: AdminUser) => {
    setUsers((current) =>
      current.map((user) => (user.id === updated.id ? updated : user)),
    )
  }

  const toggleVerify = async (user: AdminUser) => {
    setBusyId(user.id)
    try {
      updateRow(await updateAdminUser(user.id, { verified: !user.verified }))
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
      const promote = user.role === 'user'
      updateRow(
        await updateAdminUser(user.id, {
          role: promote ? 'admin' : 'user',
        }),
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

  const applyModeration = async (data: { reason: string; until?: string }) => {
    if (!moderation) return
    try {
      await moderateAdminUser(moderation.user.id, {
        action: moderation.action,
        reason: data.reason,
        until: data.until,
      })
      await refreshAfterMutation()
      dispatch(
        showToast({
          message: `${moderation.user.name} ${moderation.action === 'ban' ? 'banned' : 'suspended'}`,
          type: 'success',
        }),
      )
      setModeration(null)
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Moderation failed',
          type: 'error',
        }),
      )
      throw err
    }
  }

  const restoreUser = async (user: AdminUser) => {
    setBusyId(user.id)
    try {
      await moderateAdminUser(user.id, { action: 'restore' })
      await refreshAfterMutation()
      dispatch(
        showToast({ message: `${user.name} restored`, type: 'success' }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Restore failed',
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
      await refreshAfterMutation()
      dispatch(
        showToast({ message: `${confirmUser.name} deleted`, type: 'success' }),
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

  const actionBtn = (tone: 'white' | 'primary' | 'danger' | 'warning') =>
    `${buttonClass('ghost', 'sm', 'min-h-11')} ${
      tone === 'primary'
        ? 'bg-primary hover:bg-primaryDark hover:text-white'
        : tone === 'danger'
          ? 'bg-dangerSoft hover:bg-danger hover:text-white'
          : tone === 'warning'
            ? 'bg-warningSoft hover:bg-warning'
            : 'bg-white hover:bg-inputBg'
    }`.replace('border-transparent shadow-none', 'border-2 shadow-brutal-sm')

  return (
    <div>
      <div className='flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Users</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Manage access, roles, and verification.
          </p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto'>
          <input
            type='search'
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder='Search name or email'
            className='min-h-11 w-full lg:w-64 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm'
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className='min-h-11 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm'
          >
            <option value=''>All access states</option>
            <option value='active'>Active</option>
            <option value='suspended'>Suspended</option>
            <option value='banned'>Banned</option>
          </select>
        </div>
      </div>

      {error && !loading && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <p className='font-bold text-sm'>{error}</p>
          <button onClick={refresh} className={buttonClass('primary', 'sm')}>
            Retry
          </button>
        </div>
      )}

      <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[980px]'>
            <thead className='bg-gray-100 border-b-4 border-dark'>
              <tr>
                <th className='p-4 font-black'>User</th>
                <th className='p-4 font-black'>Email</th>
                <th className='p-4 font-black'>Access</th>
                <th className='p-4 font-black'>Role</th>
                <th className='p-4 font-black'>Projects</th>
                <th className='p-4 font-black text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {loading ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-600'>
                    Loading user accounts…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-600'>
                    No accounts match these filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className='border-b-2 border-dark border-dashed'>
                    <td className='p-4'>
                      <div className='flex items-center gap-3'>
                        <Image
                          src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.username}`}
                          alt=''
                          width={36}
                          height={36}
                          unoptimized
                          className='w-9 h-9 rounded-full border-2 border-dark bg-purpleSoft'
                        />
                        <div className='leading-tight min-w-0'>
                          <p className='font-black truncate'>{user.name}</p>
                          <p className='text-xs font-bold text-gray-600 truncate'>
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='p-4 font-bold'>{user.email}</td>
                    <td className='p-4'>
                      <div className='flex flex-wrap gap-2'>
                        <span
                          className={`border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black ${
                            user.status === 'active'
                              ? 'bg-successSoft'
                              : user.status === 'suspended'
                                ? 'bg-warningSoft'
                                : 'bg-dangerSoft'
                          }`}
                        >
                          {user.status}
                        </span>
                        {!user.verified && (
                          <span className='border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black bg-gray-200'>
                            unverified
                          </span>
                        )}
                      </div>
                      {user.status === 'suspended' && user.suspendedUntil && (
                        <p className='text-xs font-bold text-gray-600 mt-1'>
                          Until {new Date(user.suspendedUntil).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className='p-4'>
                      <span className='border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black bg-white'>
                        {user.role}
                      </span>
                    </td>
                    <td className='p-4 font-bold'>{user.projects}</td>
                    <td className='p-4'>
                      <div className='flex flex-wrap justify-end gap-2'>
                        {user.status === 'active' && (
                          <button
                            disabled={busyId === user.id}
                            onClick={() => toggleRole(user)}
                            className={actionBtn(user.role === 'admin' ? 'white' : 'primary')}
                          >
                            {user.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                        )}
                        {user.role === 'user' && user.status === 'active' && (
                          <>
                            {!user.verified && (
                              <button
                                disabled={busyId === user.id}
                                onClick={() => toggleVerify(user)}
                                className={actionBtn('white')}
                              >
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => setModeration({ user, action: 'suspend' })}
                              className={actionBtn('warning')}
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => setModeration({ user, action: 'ban' })}
                              className={actionBtn('danger')}
                            >
                              Ban
                            </button>
                          </>
                        )}
                        {user.role === 'user' && user.status !== 'active' && (
                          <button
                            disabled={busyId === user.id}
                            onClick={() => restoreUser(user)}
                            className={actionBtn('primary')}
                          >
                            Restore
                          </button>
                        )}
                        {user.role === 'user' && (
                          <button
                            disabled={busyId === user.id}
                            onClick={() => setConfirmUser(user)}
                            className={actionBtn('danger')}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          label='users'
          onPageChange={(nextPage) => {
            setLoading(true)
            setPage(nextPage)
          }}
        />
      </div>

      {moderation && (
        <ModerationDialog
          key={`${moderation.user.id}:${moderation.action}`}
          title={
            moderation.action === 'ban'
              ? `Ban ${moderation.user.name}?`
              : `Suspend ${moderation.user.name}?`
          }
          message='Their projects, comments, profile, and existing session access will be hidden immediately.'
          confirmLabel={moderation.action === 'ban' ? 'Ban account' : 'Suspend account'}
          showUntil={moderation.action === 'suspend'}
          onConfirm={applyModeration}
          onCancel={() => setModeration(null)}
        />
      )}

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
