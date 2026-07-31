'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { fetchProjects, deleteProject } from '@/store/redux/projectsSlice'
import { showToast } from '@/store/redux/toastSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'
import { PlusIcon } from '@heroicons/react/24/solid'

const DashboardClient = () => {
  const dispatch = useAppDispatch()
  const {
    items: projects,
    loading,
    error,
  } = useAppSelector((state) => state.projects)
  const { currentUser, bookmarks } = useAppSelector((state) => ({
    currentUser: state.auth.currentUser,
    bookmarks: state.bookmarks.items,
  }))

  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjects() as any)
    }
  }, [dispatch, projects.length])

  const userProjects = projects.filter(
    (p: any) => p.user_id === currentUser?.id,
  )
  const totalLikes = userProjects.reduce(
    (sum: number, p: any) => sum + (p.likes || 0),
    0,
  )
  const totalBookmarks = bookmarks.length

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteProject(deleteTarget.id) as any)
      dispatch(showToast({ message: 'Project deleted successfully.', type: 'success' }))
      setDeleteTarget(null)
    } catch {
      setDeleteError('Failed to delete project. Please try again.')
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
          <Link
            href='/dashboard/new'
            className='btn-brutal bg-accent text-white border-2 border-dark px-6 py-3 rounded-xl font-bold shadow-brutal flex items-center gap-2 w-fit'
          >
            <PlusIcon className='w-5 h-5' />
            New Project
          </Link>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
          <div className='bg-primary border-4 border-dark rounded-2xl p-6 shadow-brutal'>
            <p className='font-bold text-dark mb-1'>Total Projects</p>
            <p className='text-5xl font-black'>{userProjects.length}</p>
          </div>
          <div className='bg-[#a78bfa] text-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
            <p className='font-bold text-white mb-1'>Likes Received</p>
            <p className='text-5xl font-black'>{totalLikes}</p>
          </div>
          <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
            <p className='font-bold text-gray-500 mb-1'>Bookmarks</p>
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
        {error && <p className='text-sm font-bold text-red-500 mb-4'>{error}</p>}
        {deleteError && (
          <p className='text-sm font-bold text-red-500 mb-4'>{deleteError}</p>
        )}

        {!loading && !error && (
          <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden mb-8'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead className='bg-gray-100 border-b-4 border-dark'>
                  <tr>
                    <th className='p-4 font-black'>Title</th>
                    <th className='p-4 font-black'>Category</th>
                    <th className='p-4 font-black text-center'>Likes</th>
                    <th className='p-4 font-black text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userProjects.map((project: any) => (
                    <tr
                      key={project.id}
                      className='border-b-2 border-dark border-dashed hover:bg-yellow-50 transition-colors last:border-b-0'
                    >
                      <td className='p-4 font-bold text-dark'>
                        {project.title}
                      </td>
                      <td className='p-4'>
                        <span className='bg-primary border-2 border-dark px-2 py-1 rounded-md text-xs font-bold shadow-brutal-sm text-dark'>
                          {project.category || 'None'}
                        </span>
                      </td>
                      <td className='p-4 font-bold text-center'>{project.likes}</td>
                      <td className='p-4 text-right space-x-2'>
                        <Link
                          href={`/dashboard/edit/${project.id}`}
                          className='btn-brutal inline-block bg-white border-2 border-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-brutal-sm hover:bg-gray-50'
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(project)}
                          className='btn-brutal bg-red-400 text-white border-2 border-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-brutal-sm hover:bg-red-500'
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
                <p className='font-bold text-gray-400 mb-4'>No projects yet.</p>
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

      <Footer />
    </div>
  )
}

export default DashboardClient
