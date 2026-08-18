'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  getAdminProjects,
  getAdminCategories,
  deleteAdminProject,
  type AdminProject,
} from '@/lib/api/adminApi'
import { getCategoryColor, isCategoryLightText } from '@/lib/categoryColors'

const ProjectsClient = () => {
  const dispatch = useAppDispatch()
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmProject, setConfirmProject] = useState<AdminProject | null>(
    null,
  )
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      const [projectsResult, categoryRows] = await Promise.all([
        getAdminProjects(),
        getAdminCategories(),
      ])
      setProjects(projectsResult.data)
      setTotal(projectsResult.pagination.total)
      setCategories(categoryRows.map((c) => c.name))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([getAdminProjects(), getAdminCategories()])
      .then(([projectsResult, categoryRows]) => {
        if (cancelled) return
        setProjects(projectsResult.data)
        setTotal(projectsResult.pagination.total)
        setCategories(categoryRows.map((c) => c.name))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      const matchesCategory =
        category === 'All categories' || p.category === category
      return matchesQuery && matchesCategory
    })
  }, [projects, query, category])

  const handleDelete = async () => {
    if (!confirmProject) return
    setBusyId(confirmProject.id)
    try {
      await deleteAdminProject(confirmProject.id)
      setProjects(projects.filter((p) => p.id !== confirmProject.id))
      setTotal((t) => t - 1)
      dispatch(
        showToast({
          message: `${confirmProject.title} deleted`,
          type: 'success',
        }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Delete failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
      setConfirmProject(null)
    }
  }

  const actionBtn = (variant: 'white' | 'danger') =>
    `${buttonClass('ghost', 'sm', '')} ${
      variant === 'danger'
        ? 'bg-dangerSoft hover:bg-danger hover:text-white'
        : 'bg-white hover:bg-inputBg'
    }`.replace('border-transparent shadow-none', 'border-2 shadow-brutal-sm')

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Projects</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Moderate all submissions across the platform.
          </p>
        </div>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search title, author...'
            className='bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary sm:w-64'
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:border-primary'
          >
            <option>All categories</option>
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && !loading && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <p className='font-bold text-sm'>{error}</p>
          <button
            onClick={() => {
              setError('')
              setLoading(true)
              void load()
            }}
            className={`${buttonClass('primary', 'sm', '')} shrink-0`}
          >
            Retry
          </button>
        </div>
      )}

      <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[720px]'>
            <thead className='bg-gray-100 border-b-4 border-dark'>
              <tr>
                <th className='p-4 font-black'>Project</th>
                <th className='p-4 font-black'>Author</th>
                <th className='p-4 font-black'>Category</th>
                <th className='p-4 font-black text-center'>Likes</th>
                <th className='p-4 font-black'>Created</th>
                <th className='p-4 font-black text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {loading ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-500'>
                    Loading projects...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-500'>
                    No projects found
                  </td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr
                    key={project.id}
                    className='border-b-2 border-dark border-dashed hover:bg-yellow-50 transition-colors'
                  >
                    <td className='p-4 font-black'>{project.title}</td>
                    <td className='p-4 font-bold'>{project.author}</td>
                    <td className='p-4'>
                      <span
                        className={`${getCategoryColor(project.category)} ${
                          isCategoryLightText(project.category) ? 'text-white' : ''
                        } border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black shadow-brutal-sm`}
                      >
                        {project.category}
                      </span>
                    </td>
                    <td className='p-4 font-bold text-center'>{project.likes}</td>
                    <td className='p-4 font-bold text-gray-500'>
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className='p-4 text-right whitespace-nowrap'>
                      <button
                        disabled={busyId === project.id}
                        onClick={() => setConfirmProject(project)}
                        className={`${actionBtn('danger')} ${
                          busyId === project.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='p-4 border-t-4 border-dark flex items-center justify-between'>
          <p className='text-sm font-bold text-gray-500'>
            Showing {filtered.length} of {total} projects
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmProject}
        title='Delete project?'
        message={`This action cannot be undone. All data related to ${confirmProject?.title} will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmProject(null)}
      />
    </div>
  )
}

export default ProjectsClient