'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateProfile } from '@/store/redux/authSlice'
import { updateUserApi } from '@/lib/api/authApi'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const SettingsClient = () => {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state: any) => state.auth)

  const [name, setName] = useState(currentUser?.name || '')
  const [bio, setBio] = useState(currentUser?.bio || '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setError('')
    try {
      await updateUserApi(currentUser.id, {
        name: name.trim(),
        bio: bio.trim(),
      })
      dispatch(updateProfile({ name: name.trim(), bio: bio.trim() }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to update profile. Please try again.')
    }
  }

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='mb-8'>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>Settings</h1>
          <p className='text-sm text-gray-500'>
            Update your profile information
          </p>
        </div>

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

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label='Full name'
              id='name'
              placeholder='Your name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error}
            />
            <div className='mb-6'>
              <label
                htmlFor='bio'
                className='block text-xs text-gray-600 mb-1.5'
              >
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
              <Button type='submit' fullWidth>
                Save changes
              </Button>
              {saved && (
                <p className='text-sm text-green-600 whitespace-nowrap'>
                  Saved ✓
                </p>
              )}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default SettingsClient
