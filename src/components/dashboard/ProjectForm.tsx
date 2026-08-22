'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { UploadButton } from '@/lib/uploadthing-client'
import Image from 'next/image'
import {
  ClipboardDocumentIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'
import {
  AI_MODELS,
  DEFAULT_AI_MODEL,
  PROJECT_CATEGORIES,
  type AiTask,
} from '@/lib/aiModels'
import { generateAiContent } from '@/lib/api/aiApi'

const categoryOptions = PROJECT_CATEGORIES

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
  const [aiModel, setAiModel] = useState(DEFAULT_AI_MODEL)
  const [generating, setGenerating] = useState<AiTask | null>(null)
  const [aiError, setAiError] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const [readmeDraft, setReadmeDraft] = useState('')
  const [readmeCopied, setReadmeCopied] = useState(false)

  const technologyList = () =>
    technologies
      .split(',')
      .map((technology) => technology.trim())
      .filter(Boolean)

  const handleGenerate = async (task: 'description' | 'readme') => {
    if (!title.trim()) {
      setAiError('Add a project title before generating copy.')
      return
    }
    if (task === 'readme' && !description.trim()) {
      setAiError('Add or generate a description before drafting a README.')
      return
    }

    setAiError('')
    setReadmeCopied(false)
    setGenerating(task)
    setAiStatus(
      task === 'description' ? 'Generating description.' : 'Generating README.',
    )
    try {
      const result = await generateAiContent(task, aiModel, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        technologies: technologyList(),
        github: github.trim() || undefined,
        live: live.trim() || undefined,
      })
      if (result.task === 'description') {
        setDescription(result.text)
        setErrors((current) => ({ ...current, description: '' }))
        setAiStatus('Description generated. Review the new draft before saving.')
      } else if (result.task === 'readme') {
        setReadmeDraft(result.text)
        setAiStatus('README draft generated.')
      }
    } catch (error) {
      const requestError = error as {
        response?: { data?: { message?: string } }
      }
      setAiError(
        requestError.response?.data?.message ||
          'Could not generate content. Please try another model.',
      )
      setAiStatus('Generation failed.')
    } finally {
      setGenerating(null)
    }
  }

  const copyReadme = async () => {
    try {
      await navigator.clipboard.writeText(readmeDraft)
      setReadmeCopied(true)
      setAiStatus('README copied to the clipboard.')
    } catch {
      setAiError('Could not copy the README. Select the text and copy it manually.')
    }
  }

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
      <fieldset disabled={submitting || generating !== null} className='contents'>
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

      <section
        aria-labelledby='ai-writing-heading'
        aria-busy={generating !== null}
        className='mb-6 rounded-2xl border-4 border-dark bg-white p-4 shadow-brutal-sm sm:p-5'
      >
        <div className='mb-4 flex items-start gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-dark bg-secondary shadow-brutal-sm'>
            <SparklesIcon className='h-5 w-5' aria-hidden />
          </div>
          <div>
            <h2 id='ai-writing-heading' className='font-black text-dark'>
              AI writing tools
            </h2>
            <p className='text-sm font-semibold text-gray-600'>
              Generate a draft, then edit it until it sounds like you.
            </p>
          </div>
        </div>

        <label htmlFor='ai-model' className='mb-2 block text-sm font-black text-dark'>
          Model
        </label>
        <select
          id='ai-model'
          value={aiModel}
          onChange={(event) => setAiModel(event.target.value as typeof aiModel)}
          disabled={generating !== null}
          className='mb-4 min-h-11 w-full rounded-xl border-2 border-dark bg-bgMain px-3 py-2 font-bold text-dark shadow-brutal-sm'
        >
          {AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.note}
            </option>
          ))}
        </select>

        <div className='flex flex-col gap-3 sm:flex-row'>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            disabled={generating !== null}
            onClick={() => void handleGenerate('description')}
            className='min-h-11 w-full sm:w-auto'
          >
            <SparklesIcon className='h-4 w-4' aria-hidden />
            {generating === 'description'
              ? 'Writing...'
              : description.trim()
                ? 'Rewrite description'
                : 'Write description'}
          </Button>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            disabled={generating !== null}
            onClick={() => void handleGenerate('readme')}
            className='min-h-11 w-full sm:w-auto'
          >
            <DocumentTextIcon className='h-4 w-4' aria-hidden />
            {generating === 'readme' ? 'Drafting...' : 'Draft README'}
          </Button>
        </div>

        <p className='mt-3 text-xs font-semibold leading-relaxed text-gray-500'>
          Only the visible project fields above are sent to OpenRouter. Requests
          exclude providers marked as collecting prompt data. Free model
          availability can change.
        </p>
        {aiError && (
          <p role='alert' className='mt-3 text-sm font-bold text-red-600'>
            {aiError}
          </p>
        )}
        <p role='status' aria-live='polite' className='sr-only'>
          {aiStatus}
        </p>
      </section>

      {readmeDraft && (
        <section className='mb-6' aria-labelledby='readme-draft-heading'>
          <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
            <label
              id='readme-draft-heading'
              htmlFor='readme-draft'
              className='font-bold text-dark'
            >
              README draft
            </label>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => void copyReadme()}
              className='min-h-11'
            >
              <ClipboardDocumentIcon className='h-4 w-4' aria-hidden />
              {readmeCopied ? 'Copied' : 'Copy Markdown'}
            </Button>
          </div>
          <textarea
            id='readme-draft'
            rows={14}
            value={readmeDraft}
            onChange={(event) => {
              setReadmeDraft(event.target.value)
              setReadmeCopied(false)
            }}
            className='input-brutal w-full resize-y rounded-xl border-2 border-dark bg-white px-4 py-3 font-mono text-sm font-medium text-dark shadow-brutal-sm'
          />
          <p className='mt-2 text-xs font-semibold text-gray-500'>
            This draft is not saved with the project. Copy it to your repository.
          </p>
        </section>
      )}

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
