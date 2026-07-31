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
      className='bg-[#c4f0ff] border-4 border-dark rounded-2xl p-8 max-w-2xl shadow-brutal-lg'
    >
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
              ? 'border-red-500 shadow-[4px_4px_0px_0px_#ef4444]'
              : ''
          }`}
        />
        {errors.description && (
          <p className='text-sm font-bold text-red-500 mt-2'>{errors.description}</p>
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

      <div className='pt-6'>
        <Button type='submit' fullWidth variant='primary'>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default ProjectForm