'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { addProject } from '@/store/redux/projectsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectForm from '@/components/dashboard/ProjectForm'

const NewProjectClient = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { currentUser } = useSelector((state: any) => state.auth)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (projectData: any) => {
    setSubmitError('')
    if (!currentUser?.id) {
      setSubmitError('You must be logged in to create a project.')
      return
    }
    const slug =
      projectData.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now()
    const result = await dispatch(
      addProject({
        ...projectData,
        slug,
        github_url: projectData.github,
        live_url: projectData.live,
        user_id: currentUser.id,
      }) as any,
    )
    if (addProject.fulfilled.match(result)) {
      router.push('/dashboard')
    } else {
      setSubmitError(result.payload || 'Failed to create project.')
    }
  }

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <h1 className='text-4xl font-black mb-2'>
          New Project
        </h1>
        <p className='font-medium text-gray-600 text-lg mb-8'>
          Add a project to your portfolio
        </p>
        {submitError && (
          <p className='text-sm font-bold text-red-500 mb-4'>{submitError}</p>
        )}
        <ProjectForm onSubmit={handleSubmit} submitLabel='Create Project' />
      </main>
      <Footer />
    </div>
  )
}

export default NewProjectClient
