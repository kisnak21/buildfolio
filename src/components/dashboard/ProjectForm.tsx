'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { UploadButton } from '@/lib/uploadthing-client'
import Image from 'next/image'

const categoryOptions = [
  'SaaS',
  'AI',
  'Web App',
  'Mobile App',
  'Open Source',
  'Game',
]

export interface ProjectFormData {
  title: string
  description: string
  category: string
  technologies: string[]
  author?: string
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
    author?: string
    github?: string
    live?: string
    thumbnail?: string | null
  }
  onSubmit: (data: ProjectFormData) => Promise<void>
  submitLabel: string
}

const ProjectForm = ({
  initialValues,
  onSubmit,
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
  const [author, setAuthor] = useState(initialValues?.author || '')
  const [github, setGithub] = useState(initialValues?.github || '')
  const [live, setLive] = useState(initialValues?.live || '')
  const [thumbnail, setThumbnail] = useState(initialValues?.thumbnail || '')
  const [uploadError, setUploadError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = 'Title is required.'
    if (!description.trim()) newErrors.description = 'Description is required.'
    if (!author.trim()) newErrors.author = 'Author is required.'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        technologies: technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        author: author.trim(),
        github: github.trim(),
        live: live.trim(),
        thumbnail,
      })
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

      <div className='grid md:grid-cols-2 gap-4'>
        <Input
          label='Author name'
          id='author'
          placeholder='John Doe'
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          error={errors.author}
        />
        <Input
          label='GitHub URL'
          id='github'
          placeholder='https://github.com/...'
          value={github}
          onChange={(e) => setGithub(e.target.value)}
        />
      </div>

      <Input
        label='Live URL'
        id='live'
        placeholder='https://...'
        value={live}
        onChange={(e) => setLive(e.target.value)}
      />

      <div className='mb-5'>
        <label className='block font-bold text-dark mb-2'>
          Thumbnail
        </label>
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
          onUploadError={(error: Error) => {
            setUploadError(error.message)
          }}
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

      <div className='pt-6'>
        <Button type='submit' fullWidth variant='primary' disabled={submitting}>
          {submitting ? (
            <>
              <span
                aria-hidden
                className='inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle'
              />
              {submitLabel.startsWith('Create') ? 'Creating…' : 'Saving…'}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
      </fieldset>
    </form>
  )
}

export default ProjectForm