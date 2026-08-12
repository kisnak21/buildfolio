'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { updateProfile } from '@/store/redux/authSlice'
import { updateUserApi, changePasswordApi } from '@/lib/api/authApi'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CheckIcon } from '@heroicons/react/24/solid'

type Tab = 'profile' | 'security'

const SettingsClient = () => {
  const dispatch = useAppDispatch()
  const { currentUser } = useAppSelector((state) => state.auth)

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
    if (!currentUser) return
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
    if (!currentUser) return
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
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8 border-b-4 border-dark pb-6'>
          <h1 className='text-4xl font-black mb-2'>Settings</h1>
          <p className='font-bold text-gray-600 text-lg'>
            Manage your profile and account security
          </p>
        </div>

        {/* Tab navigation */}
        <div className='flex gap-4 mb-8 max-w-lg'>
          <button
            onClick={() => setTab('profile')}
            className={`btn-brutal px-6 py-3 font-bold rounded-xl border-2 border-dark transition-colors ${
              tab === 'profile'
                ? 'bg-primary text-dark shadow-[2px_2px_0px_0px_#111111] transform -translate-y-0.5'
                : 'bg-white text-dark hover:bg-yellow-50 shadow-brutal-sm'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setTab('security')}
            className={`btn-brutal px-6 py-3 font-bold rounded-xl border-2 border-dark transition-colors ${
              tab === 'security'
                ? 'bg-primary text-dark shadow-[2px_2px_0px_0px_#111111] transform -translate-y-0.5'
                : 'bg-white text-dark hover:bg-yellow-50 shadow-brutal-sm'
            }`}
          >
            Security
          </button>
        </div>

        {tab === 'profile' && (
          <div className='bg-white border-4 border-dark rounded-2xl p-8 max-w-lg shadow-brutal'>
            <div className='flex items-center gap-6 mb-8 pb-8 border-b-2 border-dark border-dashed'>
              <Image
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${currentUser?.email}`}
                alt={currentUser?.name || 'User Avatar'}
                width={64}
                height={64}
                unoptimized
                className='w-16 h-16 rounded-full border-2 border-dark bg-yellow-100'
              />
              <div>
                <p className='text-lg font-black text-dark'>
                  {currentUser?.name}
                </p>
                <p className='font-bold text-gray-600'>{currentUser?.email}</p>
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
                <label htmlFor='bio' className='block font-bold text-dark mb-2'>
                  Bio
                </label>
                <textarea
                  id='bio'
                  rows={3}
                  placeholder='Tell others about yourself...'
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className='input-brutal w-full bg-[#f3f4f6] border-2 border-dark rounded-xl px-4 py-3 font-medium transition-shadow resize-none'
                />
              </div>
              <div className='flex items-center gap-4 pt-2'>
                <Button type='submit' fullWidth disabled={profileSaving} variant='primary'>
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </Button>
                {profileSaved && (
                  <p className='font-bold text-green-600 whitespace-nowrap bg-green-100 px-3 py-1.5 rounded-lg border-2 border-green-600 flex items-center gap-1'>Saved <CheckIcon className='w-4 h-4' /></p>
                )}
              </div>
            </form>
          </div>
        )}

        {tab === 'security' && (
          <div className='bg-[#c4f0ff] border-4 border-dark rounded-2xl p-8 max-w-lg shadow-brutal'>
            <div className='mb-8 pb-8 border-b-2 border-dark border-dashed'>
              <h2 className='text-2xl font-black text-dark mb-2'>
                Change password
              </h2>
              <p className='font-bold text-gray-700'>
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className='mb-5'>
                <label htmlFor='currentPassword' className='block font-bold text-dark mb-2'>
                  Current password
                </label>
                <input
                  id='currentPassword'
                  type='password'
                  placeholder='••••••••'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='input-brutal w-full bg-white border-2 border-dark rounded-xl px-4 py-3 font-medium transition-shadow'
                />
              </div>
              <div className='mb-5'>
                <label htmlFor='newPassword' className='block font-bold text-dark mb-2'>
                  New password
                </label>
                <input
                  id='newPassword'
                  type='password'
                  placeholder='••••••••'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='input-brutal w-full bg-white border-2 border-dark rounded-xl px-4 py-3 font-medium transition-shadow'
                />
              </div>
              <div className='mb-2'>
                <label htmlFor='confirmPassword' className='block font-bold text-dark mb-2'>
                  Confirm new password
                </label>
                <input
                  id='confirmPassword'
                  type='password'
                  placeholder='••••••••'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='input-brutal w-full bg-white border-2 border-dark rounded-xl px-4 py-3 font-medium transition-shadow'
                />
              </div>

              {pwError && <p className='text-sm font-bold text-red-500 mt-2 mb-4'>{pwError}</p>}

              <div className='flex items-center gap-4 mt-8'>
                <Button type='submit' fullWidth disabled={pwSaving} variant='primary'>
                  {pwSaving ? 'Updating...' : 'Update password'}
                </Button>
                {pwSaved && (
                  <p className='font-bold text-green-600 whitespace-nowrap bg-green-100 px-3 py-1.5 rounded-lg border-2 border-green-600 flex items-center gap-1'>Updated <CheckIcon className='w-4 h-4' /></p>
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
