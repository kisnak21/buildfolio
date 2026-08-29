'use client'

import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { useRouter } from 'next/navigation'
import { addProject, saveDraftProject } from '@/store/redux/projectsSlice'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectForm, { type ProjectFormData } from '@/components/dashboard/ProjectForm'

interface NewProjectClientProps {
  initialIdea?: {
    title?: string
    description?: string
    category?: string
    technologies?: string[]
  }
}

const NewProjectClient = ({ initialIdea }: NewProjectClientProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { currentUser } = useAppSelector((state) => state.auth)
  const [submitError, setSubmitError] = useState('')

  const submitProject = async (projectData: ProjectFormData, draft: boolean) => {
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
    const payload = {
      ...projectData,
      slug,
      github: projectData.github,
      live: projectData.live,
      user_id: currentUser.id,
    }
    const result = draft
      ? await dispatch(saveDraftProject(payload))
      : await dispatch(addProject(payload))
    if (draft ? saveDraftProject.fulfilled.match(result) : addProject.fulfilled.match(result)) {
      dispatch(
        showToast({
          message: draft ? 'Draft saved successfully!' : 'Project created successfully!',
          type: 'success',
        }),
      )
      router.push('/dashboard')
    } else {
      setSubmitError(
        typeof result.payload === 'string'
          ? result.payload
          : draft
            ? 'Failed to save draft.'
            : 'Failed to create project.',
      )
    }
  }

  const handleSubmit = (projectData: ProjectFormData) => submitProject(projectData, false)
  const handleSaveDraft = (projectData: ProjectFormData) => submitProject(projectData, true)

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
          <p className='text-sm font-bold text-red-600 mb-4'>{submitError}</p>
        )}
        <ProjectForm
          initialValues={initialIdea}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          submitLabel='Create Project'
        />
      </main>
      <Footer />
    </div>
  )
}

export default NewProjectClient
