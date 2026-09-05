'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks'
import { fetchMyProjects, publishDraft } from '@/store/redux/projectsSlice'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { buttonClass } from '@/components/ui/buttonClass'

const DraftsClient = () => {
  const dispatch = useAppDispatch()
  const { currentUser } = useAppSelector((state) => state.auth)
  const { ownedItems: projects, ownedLoading: loading, ownedError: error } = useAppSelector(
    (state) => state.projects,
  )
  const [publishTarget, setPublishTarget] = useState<{ id: string | number; title: string } | null>(null)
  const [publishError, setPublishError] = useState('')

  useEffect(() => {
    if (currentUser?.id) dispatch(fetchMyProjects(String(currentUser.id)))
  }, [currentUser?.id, dispatch])

  const drafts = projects.filter((project) => project.status === 'DRAFT')

  const handlePublish = async () => {
    if (!publishTarget || !currentUser?.id) return
    const result = await dispatch(
      publishDraft({ id: publishTarget.id, userId: String(currentUser.id) }),
    )
    if (publishDraft.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Project published successfully.', type: 'success' }))
      setPublishTarget(null)
      setPublishError('')
    } else {
      setPublishError(result.payload || 'Failed to publish project.')
    }
  }

  return (
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10 border-b-4 border-dark pb-6'>
          <div>
            <h1 className='text-4xl font-black mb-2'>Draft Projects</h1>
            <p className='font-medium text-gray-600 text-lg'>Private projects waiting for your final review.</p>
          </div>
          <Link href='/dashboard' className={buttonClass('secondary', 'sm', 'min-h-11')}>
            Back to dashboard
          </Link>
        </div>

        {loading && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {Array.from({ length: 3 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal'>
            <p className='font-bold'>{error}</p>
          </div>
        )}

        {!loading && !error && drafts.length === 0 && (
          <EmptyState
            title='No drafts yet.'
            description='Save a project as a draft when you want to finish it later.'
            action={
              <Link href='/dashboard/new' className={buttonClass('primary', 'md', 'min-h-11')}>
                Create a project
              </Link>
            }
          />
        )}

        {!loading && !error && drafts.length > 0 && (
          <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[680px] text-left border-collapse'>
                <thead className='bg-secondary border-b-4 border-dark'>
                  <tr>
                    <th className='p-4 font-black'>Project</th>
                    <th className='p-4 font-black'>Category</th>
                    <th className='p-4 font-black'>Status</th>
                    <th className='p-4 font-black text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((project) => (
                    <tr key={project.id} className='border-b-2 border-dark border-dashed last:border-b-0'>
                      <td className='p-4 font-black'>{project.title}</td>
                      <td className='p-4 font-bold'>{project.category || 'None'}</td>
                      <td className='p-4'>
                        <span className='inline-flex rounded-md border-2 border-dark bg-secondary px-2 py-1 text-xs font-black shadow-brutal-sm'>
                          Draft
                        </span>
                      </td>
                      <td className='p-4'>
                        <div className='flex flex-wrap justify-end gap-2'>
                          <Link
                            href={`/dashboard/edit/${project.id}`}
                            className={buttonClass('secondary', 'sm', 'min-h-11')}
                          >
                            Edit
                          </Link>
                          <button
                            type='button'
                            onClick={() => setPublishTarget({ id: project.id, title: project.title })}
                            className={buttonClass('primary', 'sm', 'min-h-11')}
                          >
                            Publish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {publishError && <p className='mt-4 text-sm font-bold text-red-600'>{publishError}</p>}
      </main>

      <ConfirmDialog
        open={!!publishTarget}
        title='Publish project?'
        message={`Publish "${publishTarget?.title}" to the public catalog?`}
        confirmLabel='Publish'
        onConfirm={handlePublish}
        onCancel={() => {
          setPublishTarget(null)
          setPublishError('')
        }}
      />
      <Footer />
    </div>
  )
}

export default DraftsClient
