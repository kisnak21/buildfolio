'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { fetchMyProjects, deleteProject, publishDraft } from '@/store/redux/projectsSlice'
import { fetchBookmarks } from '@/store/redux/bookmarksSlice'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { LightBulbIcon, PlusIcon } from '@heroicons/react/24/solid'

const DashboardClient = () => {
  const dispatch = useAppDispatch()
  const {
    ownedItems: projects,
    ownedLoading: loading,
    ownedError: error,
  } = useAppSelector((state) => state.projects)
  const { currentUser, bookmarks } = useAppSelector((state) => ({
    currentUser: state.auth.currentUser,
    bookmarks: state.bookmarks.items,
  }))

  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; title?: string } | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [publishTarget, setPublishTarget] = useState<{ id: string | number; title?: string } | null>(null)
  const [publishError, setPublishError] = useState('')

  useEffect(() => {
    if (currentUser?.id) dispatch(fetchMyProjects(String(currentUser.id)))
  }, [dispatch, currentUser?.id])

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchBookmarks(String(currentUser.id)))
    }
  }, [dispatch, currentUser?.id])

  const userProjects = projects.filter(
    (p) => String(p.user_id) === String(currentUser?.id),
  )
  const publishedProjects = userProjects.filter(
    (project) => project.status === 'PUBLISHED',
  )
  const draftProjects = userProjects.filter(
    (project) => project.status === 'DRAFT',
  )
  const totalLikes = publishedProjects.reduce(
    (sum, project) => sum + (project.likes || 0),
    0,
  )
  const totalBookmarks = bookmarks.length

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentUser?.id) return
    const result = await dispatch(
      deleteProject({ id: deleteTarget.id, userId: String(currentUser.id) }),
    )
    if (deleteProject.fulfilled.match(result)) {
      dispatch(showToast({ message: 'Project deleted successfully.', type: 'success' }))
      setDeleteTarget(null)
    } else {
      setDeleteError(result.payload || 'Failed to delete project. Please try again.')
    }
  }

  const handleConfirmPublish = async () => {
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
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b-4 border-dark pb-6'>
          <div>
            <h1 className='text-4xl font-black mb-2'>
              Dashboard
            </h1>
            <p className='font-medium text-gray-600 text-lg'>Manage your showcase and profile.</p>
          </div>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Link
              href='/dashboard/ideas'
              className='btn-brutal flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-dark bg-secondary px-5 py-3 font-bold shadow-brutal'
            >
              <LightBulbIcon className='h-5 w-5' aria-hidden />
              Project Ideas
            </Link>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Link
                href='/dashboard/drafts'
                className='btn-brutal flex min-h-11 items-center justify-center rounded-xl border-2 border-dark bg-white px-5 py-3 font-bold shadow-brutal-sm'
              >
                Drafts ({userProjects.filter((project) => project.status === 'DRAFT').length})
              </Link>
              <Link
                href='/dashboard/new'
                className='btn-brutal bg-accent text-white border-2 border-dark px-6 py-3 rounded-xl font-bold shadow-brutal flex items-center justify-center gap-2 min-h-11'
              >
                <PlusIcon className='w-5 h-5' aria-hidden />
                New Project
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 gap-6 mb-12 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='bg-primary border-4 border-dark rounded-2xl p-6 shadow-brutal'>
            <p className='font-bold text-dark mb-1'>Published</p>
            <p className='text-5xl font-black'>{publishedProjects.length}</p>
          </div>
          <div className='bg-secondary border-4 border-dark rounded-2xl p-6 shadow-brutal'>
            <p className='font-bold text-dark mb-1'>Drafts</p>
            <p className='text-5xl font-black'>{draftProjects.length}</p>
          </div>
          <div className='bg-purpleSoft text-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
            <p className='font-bold text-white mb-1'>Likes Received</p>
            <p className='text-5xl font-black'>{totalLikes}</p>
          </div>
          <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
            <p className='font-bold text-gray-600 mb-1'>Bookmarks</p>
            <p className='text-5xl font-black'>
              {totalBookmarks}
            </p>
          </div>
        </div>

        <h2 className='text-2xl font-black mb-6'>Your Projects</h2>

        {loading && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        )}
        {error && <p className='text-sm font-bold text-red-600 mb-4'>{error}</p>}
        {deleteError && (
          <p className='text-sm font-bold text-red-600 mb-4'>{deleteError}</p>
        )}
        {publishError && (
          <p className='text-sm font-bold text-red-600 mb-4'>{publishError}</p>
        )}

        {!loading && !error && (
          <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden mb-8'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead className='bg-gray-100 border-b-4 border-dark'>
                  <tr>
                    <th className='p-4 font-black'>Title</th>
                    <th className='p-4 font-black'>Category</th>
                    <th className='p-4 font-black'>Status</th>
                    <th className='p-4 font-black text-center'>Likes</th>
                    <th className='p-4 font-black text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userProjects.map((project) => (
                    <tr
                      key={project.id}
                      className='border-b-2 border-dark border-dashed hover:bg-yellow-50 transition-colors last:border-b-0'
                    >
                      <td className='p-4 font-bold text-dark'>
                        <div className='flex flex-wrap items-center gap-2'>
                          {project.title}
                          {project.status === 'DRAFT' && (
                            <span className='rounded-md border-2 border-dark bg-secondary px-2 py-0.5 text-xs font-black uppercase'>
                              Draft
                            </span>
                          )}
                          {project.hiddenAt && (
                            <span
                              className='rounded-md border-2 border-dark bg-red-200 px-2 py-0.5 text-xs font-black uppercase'
                              title={project.hiddenReason || 'Hidden by a moderator'}
                            >
                              Hidden
                            </span>
                          )}
                        </div>
                        {project.hiddenAt && project.hiddenReason && (
                          <p className='mt-1 max-w-sm text-xs font-semibold text-gray-600'>
                            {project.hiddenReason}
                          </p>
                        )}
                      </td>
                      <td className='p-4'>
                        <span className='bg-primary border-2 border-dark px-2 py-1 rounded-md text-xs font-bold shadow-brutal-sm text-dark'>
                          {project.category || 'None'}
                        </span>
                      </td>
                      <td className='p-4'>
                        <span
                          className={`rounded-md border-2 border-dark px-2 py-1 text-xs font-black shadow-brutal-sm ${
                            project.status === 'DRAFT' ? 'bg-secondary' : 'bg-successSoft'
                          }`}
                        >
                          {project.status === 'DRAFT' ? 'Draft' : 'Published'}
                        </span>
                      </td>
                      <td className='p-4 font-bold text-center'>{project.likes}</td>
                      <td className='p-4 text-right space-x-2'>
                        <Link
                          href={`/dashboard/edit/${project.id}`}
                          className='btn-brutal inline-flex min-h-11 items-center bg-white border-2 border-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-brutal-sm hover:bg-gray-50'
                        >
                          Edit
                        </Link>
                        {project.status === 'DRAFT' && (
                          <button
                            onClick={() => setPublishTarget(project)}
                            className='btn-brutal inline-flex min-h-11 items-center bg-primary border-2 border-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-brutal-sm hover:bg-primaryDark hover:text-white'
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(project)}
                            className='btn-brutal inline-flex min-h-11 items-center bg-red-400 text-white border-2 border-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-brutal-sm hover:bg-red-500'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {userProjects.length === 0 && (
              <div className='text-center py-16 bg-gray-50'>
                <p className='font-bold text-gray-600 mb-4'>No projects yet.</p>
                <Link
                  href='/dashboard/new'
                  className='btn-brutal inline-flex items-center gap-2 bg-dark text-white border-2 border-dark px-6 py-3 rounded-xl font-bold shadow-brutal'
                >
                  Create your first one
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title='Delete project?'
        message={`This will permanently remove "${deleteTarget?.title}". This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!publishTarget}
        title='Publish project?'
        message={`Publish "${publishTarget?.title}" to the public catalog?`}
        confirmLabel='Publish'
        onConfirm={handleConfirmPublish}
        onCancel={() => {
          setPublishTarget(null)
          setPublishError('')
        }}
      />

      <Footer />
    </div>
  )
}

export default DashboardClient
