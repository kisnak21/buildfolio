'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { fetchProjects, deleteProject } from '@/store/redux/projectsSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ProjectCardSkeleton from '@/components/ui/ProjectCardSkeleton'

const DashboardClient = () => {
  const dispatch = useDispatch()
  const {
    items: projects,
    loading,
    error,
  } = useSelector((state: any) => state.projects)
  const { currentUser, bookmarks } = useSelector((state: any) => ({
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
      setDeleteTarget(null)
    } catch {
      setDeleteError('Failed to delete project. Please try again.')
    }
  }

  return (
    <div className='bg-gray-50 text-gray-900 min-h-screen flex flex-col'>
      <Header />

      <main className='flex-1 max-w-6xl mx-auto px-4 py-12 w-full'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 mb-1'>
              Dashboard
            </h1>
            <p className='text-sm text-gray-500'>Manage your projects</p>
          </div>
          <Link
            href='/dashboard/new'
            className='bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors'
          >
            + New Project
          </Link>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          <div className='bg-white border border-gray-200 rounded-xl p-5'>
            <p className='text-xs text-gray-500 mb-1'>Total Projects</p>
            <p className='text-2xl font-semibold text-gray-900'>
              {userProjects.length}
            </p>
          </div>
          <div className='bg-white border border-gray-200 rounded-xl p-5'>
            <p className='text-xs text-gray-500 mb-1'>Likes Received</p>
            <p className='text-2xl font-semibold text-gray-900'>{totalLikes}</p>
          </div>
          <div className='bg-white border border-gray-200 rounded-xl p-5'>
            <p className='text-xs text-gray-500 mb-1'>Bookmarks</p>
            <p className='text-2xl font-semibold text-gray-900'>
              {totalBookmarks}
            </p>
          </div>
        </div>

        {loading && (
          <div className='grid grid-cols-1 gap-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        )}
        {error && <p className='text-sm text-red-500'>{error}</p>}
        {deleteError && (
          <p className='text-sm text-red-500 mb-3'>{deleteError}</p>
        )}

        {!loading && !error && (
          <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='text-left font-medium text-gray-500 px-4 py-3'>
                    Title
                  </th>
                  <th className='text-left font-medium text-gray-500 px-4 py-3'>
                    Category
                  </th>
                  <th className='text-left font-medium text-gray-500 px-4 py-3'>
                    Likes
                  </th>
                  <th className='text-right font-medium text-gray-500 px-4 py-3'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {userProjects.map((project: any) => (
                  <tr
                    key={project.id}
                    className='border-b border-gray-100 last:border-0'
                  >
                    <td className='px-4 py-3 font-medium text-gray-900'>
                      {project.title}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-xs bg-blue-50 text-primary border border-blue-100 px-2 py-0.5 rounded-md font-medium'>
                        {project.category}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-gray-500'>{project.likes}</td>
                    <td className='px-4 py-3 text-right'>
                      <Link
                        href={`/dashboard/edit/${project.id}`}
                        className='text-primary hover:text-primary-hover transition-colors mr-4'
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(project)}
                        className='text-red-600 hover:text-red-700 transition-colors'
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {userProjects.length === 0 && (
              <p className='text-center text-sm text-gray-400 py-10'>
                No projects yet.{' '}
                <Link
                  href='/dashboard/new'
                  className='text-primary hover:text-primary-hover transition-colors'
                >
                  Create your first one
                </Link>
              </p>
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
