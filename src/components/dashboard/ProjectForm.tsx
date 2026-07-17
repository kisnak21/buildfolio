'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const categoryOptions = [
  'SaaS',
  'AI',
  'Web App',
  'Mobile App',
  'Open Source',
  'Game',
]

interface ProjectFormProps {
  initialValues?: {
    title?: string
    description?: string
    category?: string
    technologies?: string[]
    author?: string
    github?: string
    live?: string
  }
  onSubmit: (data: any) => Promise<void>
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = 'Title is required.'
    if (!description.trim()) newErrors.description = 'Description is required.'
    if (!author.trim()) newErrors.author = 'Author is required.'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      technologies: technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      author: author.trim(),
      github: github.trim() || '#',
      live: live.trim() || '#',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className='bg-white border border-gray-200 rounded-xl p-6 max-w-xl'
    >
      <Input
        label='Project title'
        id='title'
        placeholder='DevLink'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <div className='mb-4'>
        <label
          htmlFor='description'
          className='block text-xs text-gray-600 mb-1.5'
        >
          Description
        </label>
        <textarea
          id='description'
          rows={3}
          placeholder='What does this project do?'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none ${
            errors.description
              ? 'border-red-500'
              : 'border-gray-200 focus:border-primary'
          }`}
        />
        {errors.description && (
          <p className='text-xs text-red-500 mt-1.5'>{errors.description}</p>
        )}
      </div>

      <div className='mb-4'>
        <label
          htmlFor='category'
          className='block text-xs text-gray-600 mb-1.5'
        >
          Category
        </label>
        <select
          id='category'
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className='w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <Input
        label='Technologies (comma separated)'
        id='technologies'
        placeholder='React, TypeScript, PostgreSQL'
        value={technologies}
        onChange={(e) => setTechnologies(e.target.value)}
      />

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

      <Input
        label='Live URL'
        id='live'
        placeholder='https://...'
        value={live}
        onChange={(e) => setLive(e.target.value)}
      />

      <Button type='submit' fullWidth>
        {submitLabel}
      </Button>
    </form>
  )
}

export default ProjectForm
