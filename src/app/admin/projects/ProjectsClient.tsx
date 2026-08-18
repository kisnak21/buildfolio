'use client'

import { useMemo, useState } from 'react'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  adminProjects,
  adminCategories,
  type AdminProject,
} from '@/lib/adminMockData'
import { getCategoryColor, isCategoryLightText } from '@/lib/categoryColors'

const ProjectsClient = () => {
  const dispatch = useAppDispatch()
  const [projects, setProjects] = useState(adminProjects)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [confirmProject, setConfirmProject] = useState<AdminProject | null>(
    null,
  )

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

  const handleDelete = () => {
    if (!confirmProject) return
    setProjects(projects.filter((p) => p.id !== confirmProject.id))
    dispatch(
      showToast({
        message: `${confirmProject.title} deleted`,
        type: 'success',
      }),
    )
    setConfirmProject(null)
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
            {adminCategories.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

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
              {filtered.map((project) => (
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
                    {project.createdAt}
                  </td>
                  <td className='p-4 text-right whitespace-nowrap'>
                    <button
                      onClick={() =>
                        dispatch(
                          showToast({
                            message: 'Detail proyek menyusul di fase backend',
                            type: 'info',
                          }),
                        )
                      }
                      className={actionBtn('white')}
                    >
                      View
                    </button>
                    <button
                      onClick={() => setConfirmProject(project)}
                      className={`${actionBtn('danger')} ml-2`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='p-4 border-t-4 border-dark flex items-center justify-between'>
          <p className='text-sm font-bold text-gray-500'>
            Showing {filtered.length} of {projects.length} projects
          </p>
          <div className='flex gap-2'>
            <button
              disabled
              className='bg-white border-2 border-dark px-3 py-1.5 rounded-lg text-xs font-bold shadow-brutal-sm opacity-50 cursor-not-allowed'
            >
              Prev
            </button>
            <button
              onClick={() =>
                dispatch(
                  showToast({
                    message: 'Pagination backend menyusul',
                    type: 'info',
                  }),
                )
              }
              className='bg-secondary border-2 border-dark px-3 py-1.5 rounded-lg text-xs font-bold shadow-brutal-sm hover:bg-warningSoft transition-colors'
            >
              Next
            </button>
          </div>
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