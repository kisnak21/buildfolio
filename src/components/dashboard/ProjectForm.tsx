'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { UploadButton } from '@/lib/uploadthing-client'
import Image from 'next/image'
import { PROJECT_CATEGORIES } from '@/lib/aiModels'

const categoryOptions = PROJECT_CATEGORIES

export interface ProjectFormData {
  title: string
  description: string
  category: string
  technologies: string[]
  github?: string
  live?: string
  thumbnail?: string | null
}

interface ProjectFormProps {
  initialValues?: {
    title?: string
    description?: string
    category?: string
    technologies?: string[]
    github?: string
    live?: string
    thumbnail?: string | null
  }
  onSubmit: (data: ProjectFormData) => Promise<void>
  onSaveDraft?: (data: ProjectFormData) => Promise<void>
  submitLabel: string
}

const ProjectForm = ({
  initialValues,
  onSubmit,
  onSaveDraft,
  submitLabel,
}: ProjectFormProps) => {
  const [title, setTitle] = useState(initialValues?.title || '')
  const [description, setDescription] = useState(
    initialValues?.description || '',
  )
  const [category, setCategory] = useState(
    initialValues?.category || categoryOptions[0],
  )
  const [technologies, setTechnologies] = useState(
    initialValues?.technologies?.join(', ') || '',
  )
  const [github, setGithub] = useState(initialValues?.github || '')
  const [live, setLive] = useState(initialValues?.live || '')
  const [thumbnail, setThumbnail] = useState(initialValues?.thumbnail || '')
  const [uploadError, setUploadError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const formData = (): ProjectFormData => ({
    title: title.trim(),
    description: description.trim(),
    category,
    technologies: technologies
      .split(',')
      .map((technology) => technology.trim())
      .filter(Boolean),
    github: github.trim(),
    live: live.trim(),
    thumbnail,
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Title is required.'
    if (!description.trim()) newErrors.description = 'Description is required.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    setSubmitting(true)
    try {
      await onSubmit(formData())
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!onSaveDraft || submitting) return
    if (!title.trim()) {
      setErrors({ title: 'Add a title before saving this draft.' })
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await onSaveDraft(formData())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className='bg-accentSoft border-4 border-dark rounded-2xl p-8 max-w-2xl shadow-brutal-lg'
    >
      <fieldset disabled={submitting} className='contents'>
      <Input
        label='Project Title'
        id='title'
        placeholder='E.g. DevFlow'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <div className='mb-5'>
        <label
          htmlFor='category'
          className='block font-bold text-dark mb-2'
        >
          Category
        </label>
        <select
          id='category'
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className='input-brutal w-full bg-white border-2 border-dark rounded-xl px-4 py-3 font-bold text-dark shadow-brutal-sm cursor-pointer appearance-none'
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-5'>
        <label
          htmlFor='description'
          className='block font-bold text-dark mb-2'
        >
          Description
        </label>
        <textarea
          id='description'
          rows={3}
          placeholder='What does this project do?'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`input-brutal w-full bg-white border-2 border-dark rounded-xl px-4 py-3 font-medium text-dark shadow-brutal-sm resize-none ${
            errors.description
              ? 'border-red-500 shadow-brutal-danger'
              : ''
          }`}
        />
        {errors.description && (
          <p className='text-sm font-bold text-red-600 mt-2'>{errors.description}</p>
        )}
      </div>

      <Input
        label='Technologies (comma separated)'
        id='technologies'
        placeholder='React, TypeScript, PostgreSQL'
        value={technologies}
        onChange={(e) => setTechnologies(e.target.value)}
      />

      <Input
        label='GitHub URL'
        id='github'
        placeholder='https://github.com/...'
        value={github}
        onChange={(e) => setGithub(e.target.value)}
      />

        <Input
          label='Live URL'
          id='live'
          placeholder='https://...'
          value={live}
          onChange={(e) => setLive(e.target.value)}
        />

        <div className='mb-5'>
          <label className='block font-bold text-dark mb-2'>Thumbnail</label>
          {thumbnail && (
            <div className='relative w-full aspect-video border-2 border-dark rounded-xl overflow-hidden mb-3 shadow-brutal-sm'>
              <Image
                src={thumbnail}
                alt='Project thumbnail'
                fill
                sizes='(max-width: 672px) 100vw, 672px'
                className='object-cover'
              />
            </div>
          )}
          <UploadButton
            endpoint='imageUploader'
            onClientUploadComplete={(res) => {
              if (res?.[0]?.url) {
                setThumbnail(res[0].url)
                setUploadError('')
              }
            }}
            onUploadError={(error: Error) => setUploadError(error.message)}
            appearance={{
              container: 'w-full',
              button:
                'w-full bg-white border-2 border-dark rounded-xl font-bold shadow-brutal-sm hover:bg-yellow-100 transition-colors',
              allowedContent: 'text-xs text-gray-600 font-bold',
            }}
            content={{
              button: thumbnail ? 'Replace thumbnail' : 'Upload thumbnail',
            }}
          />
          {thumbnail && (
            <button
              type='button'
              onClick={() => setThumbnail('')}
              className='text-sm font-bold text-red-600 hover:underline mt-2'
            >
              Remove thumbnail
            </button>
          )}
          {uploadError && (
            <p className='text-sm font-bold text-red-600 mt-2'>{uploadError}</p>
          )}
        </div>

      <div className='flex flex-col gap-3 pt-6 sm:flex-row'>
        {onSaveDraft && (
          <Button
            type='button'
            fullWidth
            variant='secondary'
            disabled={submitting}
            onClick={() => void handleSaveDraft()}
          >
            Save as draft
          </Button>
        )}
        <Button type='submit' fullWidth variant='primary' disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
      </fieldset>
    </form>
  )
}

export default ProjectForm
