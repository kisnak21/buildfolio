'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { updateProject } from '@/store/redux/projectsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectForm from '@/components/dashboard/ProjectForm'

const EditProjectClient = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const router = useRouter()
  const [submitError, setSubmitError] = useState('')

  const { currentUser } = useSelector((state: any) => state.auth)
  const project = useSelector((state: any) =>
    state.projects.items.find((p: any) => p.id === id),
  )

  const isOwner = project?.user_id === currentUser?.id

  const handleSubmit = async (projectData: any) => {
    setSubmitError('')
    const result = await dispatch(
      updateProject({
        id: project.id,
        updatedFields: {
          title: projectData.title,
          description: projectData.description,
          github_url: projectData.github,
          live_url: projectData.live,
        },
      }) as any,
    )
    if (updateProject.fulfilled.match(result)) {
      router.push('/dashboard')
    } else {
      setSubmitError(result.payload || 'Failed to update project.')
    }
  }

  if (!project) {
    return (
      <div className='bg-gray-50 text-gray-900 min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
          <p className='text-sm text-gray-500'>Project not found.</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className='bg-gray-50 text-gray-900 min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
          <p className='text-sm text-gray-500'>
            You don&apos;t have permission to edit this project.
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className='bg-gray-50 text-gray-900 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <h1 className='text-xl font-semibold text-gray-900 mb-1'>
          Edit Project
        </h1>
        <p className='text-sm text-gray-500 mb-8'>
          Update your project details
        </p>
        {submitError && (
          <p className='text-sm text-red-500 mb-4'>{submitError}</p>
        )}
        <ProjectForm
          initialValues={project}
          onSubmit={handleSubmit}
          submitLabel='Save Changes'
        />
      </main>
      <Footer />
    </div>
  )
}

export default EditProjectClient
