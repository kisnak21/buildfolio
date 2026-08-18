'use client'

import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  getAdminCategories,
  getAdminTechs,
  createAdminCategory,
  renameAdminCategory,
  deleteAdminCategory,
  createAdminTech,
  deleteAdminTech,
  type AdminCategory,
  type AdminTech,
} from '@/lib/api/adminApi'
import { getCategoryColor, isCategoryLightText } from '@/lib/categoryColors'

const CategoriesClient = () => {
  const dispatch = useAppDispatch()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [techs, setTechs] = useState<AdminTech[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [newName, setNewName] = useState('')
  const [techModalOpen, setTechModalOpen] = useState(false)
  const [newTechName, setNewTechName] = useState('')
  const [confirmCategory, setConfirmCategory] = useState<AdminCategory | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [categoryRows, techRows] = await Promise.all([
        getAdminCategories(),
        getAdminTechs(),
      ])
      setCategories(categoryRows)
      setTechs(techRows)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([getAdminCategories(), getAdminTechs()])
      .then(([categoryRows, techRows]) => {
        if (cancelled) return
        setCategories(categoryRows)
        setTechs(techRows)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const openAdd = () => {
    setEditing(null)
    setNewName('')
    setModalOpen(true)
  }

  const openEdit = (category: AdminCategory) => {
    setEditing(category)
    setNewName(category.name)
    setModalOpen(true)
  }

  const submitModal = async () => {
    const name = newName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      if (editing) {
        const updated = await renameAdminCategory(editing.id, name)
        setCategories(
          categories.map((c) =>
            c.id === updated.id ? { ...c, name: updated.name } : c,
          ),
        )
        dispatch(
          showToast({
            message: `Category renamed to "${updated.name}"`,
            type: 'success',
          }),
        )
      } else {
        const created = await createAdminCategory(name)
        setCategories([...categories, { ...created, projects: 0 }])
        dispatch(
          showToast({
            message: `Category "${created.name}" added`,
            type: 'success',
          }),
        )
      }
      setModalOpen(false)
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Save failed',
          type: 'error',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const requestDelete = (category: AdminCategory) => {
    if (category.projects > 0) {
      dispatch(
        showToast({
          message: `Masih dipakai ${category.projects} proyek — tidak bisa dihapus`,
          type: 'info',
        }),
      )
      return
    }
    setConfirmCategory(category)
  }

  const handleDelete = async () => {
    if (!confirmCategory || busy) return
    setBusy(true)
    try {
      await deleteAdminCategory(confirmCategory.id)
      setCategories(categories.filter((c) => c.id !== confirmCategory.id))
      dispatch(
        showToast({
          message: `Category "${confirmCategory.name}" deleted`,
          type: 'success',
        }),
      )
      setConfirmCategory(null)
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Delete failed',
          type: 'error',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const addTech = async () => {
    const name = newTechName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      const created = await createAdminTech(name)
      setTechs([...techs, { ...created, used: false }])
      setNewTechName('')
      setTechModalOpen(false)
      dispatch(
        showToast({
          message: `Tech "${created.name}" added`,
          type: 'success',
        }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Add failed',
          type: 'error',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const removeTech = async (tech: AdminTech) => {
    if (busy) return
    setBusy(true)
    try {
      await deleteAdminTech(tech.id)
      setTechs(techs.filter((t) => t.id !== tech.id))
      dispatch(
        showToast({ message: `Tech "${tech.name}" deleted`, type: 'success' }),
      )
    } catch (err: unknown) {
      dispatch(
        showToast({
          message: err instanceof Error ? err.message : 'Delete failed',
          type: 'error',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const cardBtn = (variant: 'white' | 'danger') =>
    `${buttonClass('ghost', 'sm', '')} ${
      variant === 'danger'
        ? 'bg-dangerSoft hover:bg-danger hover:text-white'
        : 'bg-white hover:bg-inputBg'
    }`.replace('border-transparent shadow-none', 'border-2 shadow-brutal-sm')

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-4 border-dark pb-6'>
        <div>
          <h1 className='text-4xl font-black mb-2'>
            Categories & Technologies
          </h1>
          <p className='font-medium text-gray-600 text-lg'>
            Manage taxonomy used across projects.
          </p>
        </div>
        <Button onClick={openAdd} className='shrink-0'>
          <PlusIcon className='w-5 h-5' />
          Add Category
        </Button>
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

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='bg-white border-4 border-dark rounded-2xl p-5 shadow-brutal animate-pulse'
            >
              <div className='h-6 w-24 bg-gray-200 rounded mb-4' />
              <div className='h-4 w-16 bg-gray-200 rounded' />
            </div>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10'>
          {categories.map((category) => {
            const lightText = isCategoryLightText(category.name)
            return (
              <div
                key={category.id}
                className={`${getCategoryColor(category.name)} border-4 border-dark rounded-2xl p-5 shadow-brutal`}
              >
                <div className='flex items-center justify-between mb-3'>
                  <p className='font-black text-lg'>{category.name}</p>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => openEdit(category)}
                      className={cardBtn('white')}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => requestDelete(category)}
                      className={cardBtn('danger')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p
                  className={`text-xs font-bold ${
                    lightText ? 'text-white/80' : 'text-gray-700'
                  }`}
                >
                  {category.projects} projects
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-xl font-black'>Technologies</h2>
          <button
            onClick={() => {
              setNewTechName('')
              setTechModalOpen(true)
            }}
            className='bg-white border-2 border-dark px-4 py-2 rounded-xl text-sm font-bold shadow-brutal-sm hover:bg-inputBg flex items-center gap-1 transition-colors'
          >
            <PlusIcon className='w-4 h-4' />
            Add
          </button>
        </div>
        <div className='flex flex-wrap gap-3'>
          {techs.map((tech) => (
            <span
              key={tech.id}
              className={`border-2 border-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-brutal-sm flex items-center gap-2 ${
                tech.used ? 'bg-white' : 'bg-warningSoft'
              }`}
            >
              {tech.name}
              <button
                onClick={() => removeTech(tech)}
                className='w-4 h-4 bg-dangerSoft border border-dark rounded-full text-[10px] font-black leading-none hover:bg-danger hover:text-white transition-colors'
                aria-label={`Remove ${tech.name}`}
              >
                ×
              </button>
            </span>
          ))}
          {techs.length === 0 && !loading && (
            <p className='text-sm font-bold text-gray-500'>No technologies yet</p>
          )}
        </div>
        <p className='text-xs font-bold text-gray-500 mt-4'>
          Technologies referenced by projects are locked — hanya yang tak
          terpakai bisa dihapus langsung.
        </p>
      </div>

      {modalOpen && (
        <div className='fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
          <div className='bg-white border-4 border-dark rounded-2xl p-6 w-full max-w-sm shadow-brutal-lg'>
            <h3 className='text-xl font-black text-dark mb-2'>
              {editing ? 'Edit Category' : 'Add Category'}
            </h3>
            <input
              type='text'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitModal()}
              placeholder='e.g. DevOps'
              autoFocus
              className='w-full bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm mb-6 focus:outline-none focus:border-primary'
            />
            <div className='flex items-center justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitModal} disabled={!newName.trim() || busy}>
                {editing ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {techModalOpen && (
        <div className='fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
          <div className='bg-white border-4 border-dark rounded-2xl p-6 w-full max-w-sm shadow-brutal-lg'>
            <h3 className='text-xl font-black text-dark mb-2'>Add Technology</h3>
            <input
              type='text'
              value={newTechName}
              onChange={(e) => setNewTechName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTech()}
              placeholder='e.g. Vue'
              autoFocus
              className='w-full bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm mb-6 focus:outline-none focus:border-primary'
            />
            <div className='flex items-center justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => setTechModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addTech} disabled={!newTechName.trim() || busy}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmCategory}
        title='Delete category?'
        message={`This action cannot be undone. The category "${confirmCategory?.name}" will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmCategory(null)}
      />
    </div>
  )
}

export default CategoriesClient