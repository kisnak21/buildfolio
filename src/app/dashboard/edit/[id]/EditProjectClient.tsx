'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import {
  fetchMyProjects,
  publishDraft,
  updateProject,
} from '@/store/redux/projectsSlice'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectForm, { type ProjectFormData } from '@/components/dashboard/ProjectForm'

const EditProjectClient = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [submitError, setSubmitError] = useState('')

  const { currentUser } = useAppSelector((state) => state.auth)
  const project = useAppSelector((state) =>
    state.projects.ownedItems.find((p) => String(p.id) === id),
  )

  useEffect(() => {
    if (project) return
    if (currentUser?.id) dispatch(fetchMyProjects(String(currentUser.id)))
  }, [currentUser?.id, dispatch, project])

  const isOwner = String(project?.user_id) === String(currentUser?.id)

  const handleSubmit = async (projectData: ProjectFormData) => {
    setSubmitError('')
    if (!project || !currentUser?.id) return
    const result = await dispatch(
      updateProject({
        id: project.id,
        userId: String(currentUser.id),
        updatedFields: {
          title: projectData.title,
          description: projectData.description,
          github: projectData.github,
          live: projectData.live,
          technologies: projectData.technologies,
          category: projectData.category,
          thumbnail: projectData.thumbnail,
        },
      }),
    )
    if (updateProject.fulfilled.match(result)) {
      if (project.status === 'DRAFT') {
        const published = await dispatch(
          publishDraft({ id: project.id, userId: String(currentUser.id) }),
        )
        if (!publishDraft.fulfilled.match(published)) {
          setSubmitError(published.payload || 'Failed to publish project.')
          return
        }
      }
      dispatch(showToast({ message: project.status === 'DRAFT' ? 'Project published.' : 'Project updated successfully!', type: 'success' }))
      router.push('/dashboard')
    } else {
      setSubmitError(result.payload || 'Failed to update project.')
    }
  }

  const handleSaveDraft = async (projectData: ProjectFormData) => {
    setSubmitError('')
    if (!project || !currentUser?.id) return
    const result = await dispatch(
      updateProject({
        id: project.id,
        userId: String(currentUser.id),
        updatedFields: {
          title: projectData.title,
          description: projectData.description,
          github: projectData.github,
          live: projectData.live,
          technologies: projectData.technologies,
          category: projectData.category,
          thumbnail: projectData.thumbnail,
        },
      }),
    )
    if (updateProject.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Draft updated.', type: 'success' }))
      router.push('/dashboard')
    } else {
      setSubmitError(result.payload || 'Failed to update draft.')
    }
  }

  if (!project) {
    return (
      <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
          <p className='font-bold text-gray-600'>Project not found.</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
          <p className='font-bold text-gray-600'>
            You don&apos;t have permission to edit this project.
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <h1 className='text-4xl font-black mb-2'>
          Edit Project
        </h1>
        <p className='font-medium text-gray-600 text-lg mb-8'>
          Update your project details
        </p>
        {submitError && (
          <p className='text-sm font-bold text-red-600 mb-4'>{submitError}</p>
        )}
        <ProjectForm
          initialValues={project}
          onSubmit={handleSubmit}
          onSaveDraft={project.status === 'DRAFT' ? handleSaveDraft : undefined}
          submitLabel={project.status === 'DRAFT' ? 'Publish Project' : 'Save Changes'}
        />
      </main>
      <Footer />
    </div>
  )
}

export default EditProjectClient
