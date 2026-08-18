'use client'

import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useAppDispatch } from '@/store/redux/hooks'
import { showToast } from '@/store/redux/toastSlice'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import {
  adminCategories,
  adminTech,
  categoryPalette,
  type AdminCategory,
  type AdminTech,
} from '@/lib/adminMockData'

const CategoriesClient = () => {
  const dispatch = useAppDispatch()
  const [categories, setCategories] = useState(adminCategories)
  const [techs, setTechs] = useState(adminTech)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmCategory, setConfirmCategory] = useState<AdminCategory | null>(
    null,
  )

  const addCategory = () => {
    const name = newName.trim()
    if (!name) return
    const color =
      categoryPalette[categories.length % categoryPalette.length]
    setCategories([
      ...categories,
      {
        id: `cat-${Date.now()}`,
        name,
        projects: 0,
        colorClass: color,
      },
    ])
    setNewName('')
    setShowAdd(false)
    dispatch(
      showToast({ message: `Category "${name}" added`, type: 'success' }),
    )
  }

  const requestDelete = (category: AdminCategory) => {
    if (category.projects > 0) {
      dispatch(
        showToast({
          message: `Masih dipakai ${category.projects} proyek — hanya bisa dihapus setelah backend`,
          type: 'info',
        }),
      )
      return
    }
    setConfirmCategory(category)
  }

  const handleDelete = () => {
    if (!confirmCategory) return
    setCategories(categories.filter((c) => c.id !== confirmCategory.id))
    dispatch(
      showToast({
        message: `Category "${confirmCategory.name}" deleted`,
        type: 'success',
      }),
    )
    setConfirmCategory(null)
  }

  const removeTech = (tech: AdminTech) => {
    if (tech.used) {
      dispatch(
        showToast({
          message: `"${tech.name}" dipakai proyek (locked)`,
          type: 'info',
        }),
      )
      return
    }
    setTechs(techs.filter((t) => t.id !== tech.id))
    dispatch(
      showToast({ message: `Tech "${tech.name}" deleted`, type: 'success' }),
    )
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
        <Button onClick={() => setShowAdd(true)} className='shrink-0'>
          <PlusIcon className='w-5 h-5' />
          Add Category
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10'>
        {categories.map((category) => (
          <div
            key={category.id}
            className={`${category.colorClass} border-4 border-dark rounded-2xl p-5 shadow-brutal`}
          >
            <div className='flex items-center justify-between mb-3'>
              <p className='font-black text-lg'>{category.name}</p>
              <div className='flex gap-2'>
                <button
                  onClick={() =>
                    dispatch(
                      showToast({
                        message: `Edit "${category.name}" menyusul di fase backend`,
                        type: 'info',
                      }),
                    )
                  }
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
                category.colorClass.includes('text-white')
                  ? 'text-white/80'
                  : 'text-gray-700'
              }`}
            >
              {category.projects} projects
            </p>
          </div>
        ))}
      </div>

      <div className='bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-xl font-black'>Technologies</h2>
          <button
            onClick={() =>
              dispatch(
                showToast({
                  message: 'Add tech menyusul di fase backend',
                  type: 'info',
                }),
              )
            }
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
              {tech.used ? tech.name : `+ ${tech.name} (new)`}
              <button
                onClick={() => removeTech(tech)}
                className='w-4 h-4 bg-dangerSoft border border-dark rounded-full text-[10px] font-black leading-none hover:bg-danger hover:text-white transition-colors'
                aria-label={`Remove ${tech.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <p className='text-xs font-bold text-gray-500 mt-4'>
          Technologies referenced by projects are locked — hanya yang tak
          terpakai bisa dihapus langsung.
        </p>
      </div>

      {showAdd && (
        <div className='fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
          <div className='bg-white border-4 border-dark rounded-2xl p-6 w-full max-w-sm shadow-brutal-lg'>
            <h3 className='text-xl font-black text-dark mb-2'>Add Category</h3>
            <input
              type='text'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder='e.g. DevOps'
              autoFocus
              className='w-full bg-white border-2 border-dark px-4 py-3 rounded-xl font-bold shadow-brutal-sm mb-6 focus:outline-none focus:border-primary'
            />
            <div className='flex items-center justify-end gap-3'>
              <Button variant='secondary' onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button onClick={addCategory} disabled={!newName.trim()}>
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