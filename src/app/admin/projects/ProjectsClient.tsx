'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ModerationDialog from '@/components/admin/ModerationDialog'
import AdminPagination from '@/components/admin/AdminPagination'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  deleteAdminProject,
  getAdminCategories,
  getAdminProjects,
  moderateAdminProject,
  type AdminProject,
  type ListResponse,
} from '@/lib/api/adminApi'
import { getCategoryColor, isCategoryLightText } from '@/lib/categoryColors'

const emptyPagination: ListResponse<AdminProject>['pagination'] = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

const ProjectsClient = () => {
  const dispatch = useAppDispatch()
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [categories, setCategories] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmProject, setConfirmProject] = useState<AdminProject | null>(null)
  const [hideProject, setHideProject] = useState<AdminProject | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getAdminProjects({
        page,
        limit: 20,
        search: deferredQuery.trim() || undefined,
        category: category || undefined,
        status: status || undefined,
      }),
      getAdminCategories(),
    ])
      .then(([projectResult, categoryRows]) => {
        if (cancelled) return
        setProjects(projectResult.data)
        setPagination(projectResult.pagination)
        setCategories(categoryRows.map((row) => row.name))
        setError('')
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load projects')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [category, deferredQuery, page, status])

  const refresh = async () => {
    setLoading(true)
    try {
      const result = await getAdminProjects({
        page,
        limit: 20,
        search: deferredQuery.trim() || undefined,
        category: category || undefined,
        status: status || undefined,
      })
      setProjects(result.data)
      setPagination(result.pagination)
      setError('')
      return result
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const refreshAfterMutation = async () => {
    const result = await refresh()
    if (result?.data.length === 0 && result.pagination.total > 0 && page > 1) {
      setPage((current) => current - 1)
    }
  }

  const hide = async ({ reason }: { reason: string }) => {
    if (!hideProject) return
    try {
      await moderateAdminProject(hideProject.id, { hidden: true, reason })
      await refreshAfterMutation()
      dispatch(
        showToast({ message: `${hideProject.title} hidden`, type: 'success' }),
      )
      setHideProject(null)
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Hide failed',
          type: 'error',
        }),
      )
      throw err
    }
  }

  const toggleVisibility = async (project: AdminProject) => {
    if (!project.hiddenAt) {
      setHideProject(project)
      return
    }
    setBusyId(project.id)
    try {
      await moderateAdminProject(project.id, { hidden: false })
      await refreshAfterMutation()
      dispatch(
        showToast({ message: `${project.title} visible again`, type: 'success' }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Update failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
    }
  }

  const toggleFeatured = async (project: AdminProject) => {
    setBusyId(project.id)
    try {
      const featured = !project.featuredAt
      await moderateAdminProject(project.id, { featured })
      await refreshAfterMutation()
      dispatch(
        showToast({
          message: `${project.title} ${featured ? 'pinned to Featured' : 'removed from Featured'}`,
          type: 'success',
        }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Update failed',
          type: 'error',
        }),
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!confirmProject) return
    setBusyId(confirmProject.id)
    try {
      await deleteAdminProject(confirmProject.id)
      await refreshAfterMutation()
      dispatch(
        showToast({ message: `${confirmProject.title} deleted`, type: 'success' }),
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

  const actionBtn = (tone: 'white' | 'primary' | 'danger' | 'warning') =>
    `${buttonClass('ghost', 'sm', 'min-h-11')} ${
      tone === 'primary'
        ? 'bg-primary hover:bg-primaryDark hover:text-white'
        : tone === 'danger'
          ? 'bg-dangerSoft hover:bg-danger hover:text-white'
          : tone === 'warning'
            ? 'bg-warningSoft hover:bg-warning'
            : 'bg-white hover:bg-inputBg'
    }`.replace('border-transparent shadow-none', 'border-2 shadow-brutal-sm')

  return (
    <div>
      <div className='flex flex-col gap-5 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>Projects</h1>
          <p className='font-medium text-gray-600 text-lg'>
            Pin strong work, hide violations, or delete permanently.
          </p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <input
            type='search'
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder='Search title or author'
            className='min-h-11 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm'
          />
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setPage(1)
            }}
            className='min-h-11 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm'
          >
            <option value=''>All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className='min-h-11 bg-white border-2 border-dark px-4 py-2.5 rounded-xl font-bold shadow-brutal-sm'
          >
            <option value=''>All states</option>
            <option value='visible'>Visible</option>
            <option value='featured'>Featured</option>
            <option value='hidden'>Hidden</option>
            <option value='draft'>Drafts</option>
          </select>
        </div>
      </div>

      {error && !loading && (
        <div className='bg-dangerSoft border-4 border-dark rounded-2xl p-5 shadow-brutal mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <p className='font-bold text-sm'>{error}</p>
          <button onClick={refresh} className={buttonClass('primary', 'sm')}>
            Retry
          </button>
        </div>
      )}

      <div className='bg-white border-4 border-dark rounded-2xl shadow-brutal overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[940px]'>
            <thead className='bg-gray-100 border-b-4 border-dark'>
              <tr>
                <th className='p-4 font-black'>Project</th>
                <th className='p-4 font-black'>Author</th>
                <th className='p-4 font-black'>Category</th>
                <th className='p-4 font-black'>State</th>
                <th className='p-4 font-black text-center'>Likes</th>
                <th className='p-4 font-black text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {loading ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-600'>
                    Loading project moderation queue…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center font-bold text-gray-600'>
                    No projects match these filters.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className='border-b-2 border-dark border-dashed'>
                    <td className='p-4 font-black'>{project.title}</td>
                    <td className='p-4 font-bold'>{project.author}</td>
                    <td className='p-4'>
                      <span
                        className={`${getCategoryColor(project.category)} ${
                          isCategoryLightText(project.category) ? 'text-white' : ''
                        } border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black`}
                      >
                        {project.category}
                      </span>
                    </td>
                    <td className='p-4'>
                      <div className='flex flex-wrap gap-2'>
                         <span
                           className={`border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black ${
                             project.status === 'DRAFT'
                               ? 'bg-secondary'
                               : project.hiddenAt
                                 ? 'bg-dangerSoft'
                                 : 'bg-successSoft'
                           }`}
                         >
                           {project.status === 'DRAFT' ? 'draft' : project.hiddenAt ? 'hidden' : 'visible'}
                        </span>
                        {project.featuredAt && (
                          <span className='border-2 border-dark px-2 py-0.5 rounded-md text-xs font-black bg-primary'>
                            featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='p-4 font-bold text-center'>{project.likes}</td>
                      <td className='p-4'>
                        <div className='flex flex-wrap justify-end gap-2'>
                          {project.status === 'PUBLISHED' && (
                            <>
                              <button
                                disabled={busyId === project.id}
                                onClick={() => toggleVisibility(project)}
                                className={actionBtn(project.hiddenAt ? 'primary' : 'warning')}
                              >
                                {project.hiddenAt ? 'Unhide' : 'Hide'}
                              </button>
                              {!project.hiddenAt && (
                                <button
                                  disabled={busyId === project.id}
                                  onClick={() => toggleFeatured(project)}
                                  className={actionBtn(project.featuredAt ? 'white' : 'primary')}
                                >
                                  {project.featuredAt ? 'Unfeature' : 'Feature'}
                                </button>
                              )}
                            </>
                          )}
                        <button
                          disabled={busyId === project.id}
                          onClick={() => setConfirmProject(project)}
                          className={actionBtn('danger')}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          label='projects'
          onPageChange={(nextPage) => {
            setLoading(true)
            setPage(nextPage)
          }}
        />
      </div>

      {hideProject && (
        <ModerationDialog
          key={hideProject.id}
          title={`Hide ${hideProject.title}?`}
          message='The project will disappear from public lists, search, profiles, bookmarks, and direct links. The owner can still edit it.'
          confirmLabel='Hide project'
          onConfirm={hide}
          onCancel={() => setHideProject(null)}
        />
      )}

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
