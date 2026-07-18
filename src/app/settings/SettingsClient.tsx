'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateProfile } from '@/store/redux/authSlice'
import { updateUserApi, changePasswordApi } from '@/lib/api/authApi'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Tab = 'profile' | 'security'

const SettingsClient = () => {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state: any) => state.auth)

  const [tab, setTab] = useState<Tab>('profile')

  // Profile form
  const [name, setName] = useState(currentUser?.name || '')
  const [bio, setBio] = useState(currentUser?.bio || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setProfileError('Name is required.')
      return
    }
    setProfileError('')
    setProfileSaving(true)
    try {
      await updateUserApi(currentUser.id, { name: name.trim(), bio: bio.trim() })
      dispatch(updateProfile({ name: name.trim(), bio: bio.trim() }))
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      setProfileError('Failed to update profile. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required.')
      return
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPwError('New password must contain uppercase, lowercase, and a number.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.')
      return
    }
    if (currentPassword === newPassword) {
      setPwError('New password must be different from current password.')
      return
    }

    setPwSaving(true)
    try {
      await changePasswordApi(currentUser.id, { currentPassword, newPassword })
      setPwSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err: any) {
      setPwError(
        err?.response?.data?.message || 'Failed to change password. Please try again.',
      )
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8'>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>Settings</h1>
          <p className='text-sm text-gray-500'>
            Manage your profile and account security
          </p>
        </div>

        {/* Tab navigation */}
        <div className='flex gap-1 mb-6 border-b border-gray-200 max-w-lg'>
          <button
            onClick={() => setTab('profile')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setTab('security')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Security
          </button>
        </div>

        {tab === 'profile' && (
          <div className='bg-white border border-gray-200 rounded-xl p-6 max-w-lg'>
            <div className='flex items-center gap-4 mb-6 pb-6 border-b border-gray-100'>
              <img
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${currentUser?.email}`}
                alt={currentUser?.name}
                className='w-14 h-14 rounded-full border border-gray-200'
              />
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {currentUser?.name}
                </p>
                <p className='text-xs text-gray-500'>{currentUser?.email}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} noValidate>
              <Input
                label='Full name'
                id='name'
                placeholder='Your name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={profileError}
              />
              <div className='mb-6'>
                <label htmlFor='bio' className='block text-xs text-gray-600 mb-1.5'>
                  Bio
                </label>
                <textarea
                  id='bio'
                  rows={3}
                  placeholder='Tell others about yourself...'
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className='w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none'
                />
              </div>
              <div className='flex items-center gap-3'>
                <Button type='submit' fullWidth disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </Button>
                {profileSaved && (
                  <p className='text-sm text-green-600 whitespace-nowrap'>Saved ✓</p>
                )}
              </div>
            </form>
          </div>
        )}

        {tab === 'security' && (
          <div className='bg-white border border-gray-200 rounded-xl p-6 max-w-lg'>
            <div className='mb-6 pb-6 border-b border-gray-100'>
              <p className='text-sm font-medium text-gray-900 mb-1'>
                Change password
              </p>
              <p className='text-xs text-gray-500'>
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className='mb-4'>
                <label htmlFor='currentPassword' className='block text-xs text-gray-600 mb-1.5'>
                  Current password
                </label>
                <input
                  id='currentPassword'
                  type='password'
                  placeholder='••••••••'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
                />
              </div>
              <div className='mb-4'>
                <label htmlFor='newPassword' className='block text-xs text-gray-600 mb-1.5'>
                  New password
                </label>
                <input
                  id='newPassword'
                  type='password'
                  placeholder='••••••••'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
                />
              </div>
              <div className='mb-2'>
                <label htmlFor='confirmPassword' className='block text-xs text-gray-600 mb-1.5'>
                  Confirm new password
                </label>
                <input
                  id='confirmPassword'
                  type='password'
                  placeholder='••••••••'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
                />
              </div>

              {pwError && <p className='text-sm text-red-500 mb-4'>{pwError}</p>}

              <div className='flex items-center gap-3 mt-6'>
                <Button type='submit' fullWidth disabled={pwSaving}>
                  {pwSaving ? 'Updating...' : 'Update password'}
                </Button>
                {pwSaved && (
                  <p className='text-sm text-green-600 whitespace-nowrap'>Updated ✓</p>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default SettingsClient
