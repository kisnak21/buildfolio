'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRightIcon,
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import type { AiIdea } from '@/lib/aiModels'
import { generateAiContent, type AiIdeasStreamEvent } from '@/lib/api/aiApi'

const cardColors = ['bg-primary', 'bg-accentSoft', 'bg-secondary']

const ideaHref = (idea: AiIdea) => {
  const params = new URLSearchParams({
    title: idea.title,
    description: idea.description,
    category: idea.category,
    technologies: idea.technologies.join(', '),
  })
  return `/dashboard/new?${params.toString()}`
}

const IdeasClient = () => {
  const [interests, setInterests] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [experience, setExperience] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('intermediate')
  const [ideas, setIdeas] = useState<AiIdea[]>([])
  const [error, setError] = useState('')
  const [generationStatus, setGenerationStatus] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault()
    const technologyList = technologies
      .split(',')
      .map((technology) => technology.trim())
      .filter(Boolean)

    if (!interests.trim() && technologyList.length === 0) {
      setError('Add an interest or at least one technology.')
      return
    }

    setGenerating(true)
    setError('')
    setGenerationStatus('Generating three project ideas.')
    try {
      const result = await generateAiContent('ideas', undefined, {
        interests: interests.trim() || undefined,
        technologies: technologyList,
        experience,
      }, {
        onEvent: (event: AiIdeasStreamEvent) => {
          if (event.event === 'meta' && typeof event.data.model === 'string') {
            const attempt =
              typeof event.data.attempt === 'number' ? event.data.attempt : 1
            const total =
              typeof event.data.total === 'number' ? event.data.total : 1
            setGenerationStatus(
              `Generating ideas (${attempt}/${total}).`,
            )
          } else if (event.event === 'fallback') {
            setGenerationStatus('Trying a backup model.')
          } else if (event.event === 'progress') {
            setGenerationStatus('The AI is drafting ideas.')
          }
        },
      })
      if (result.task === 'ideas') {
        setIdeas(result.ideas)
        setGenerationStatus('Three project ideas generated.')
      }
    } catch (requestError) {
      const apiError = requestError as {
        response?: { data?: { message?: string } }
      }
      setError(
        apiError.response?.data?.message ||
          'Could not generate ideas. Please try again.',
      )
      setGenerationStatus('Idea generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className='flex min-h-screen flex-col bg-bgMain text-dark'>
      <Header />
      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-14'>
        <div className='mb-10 grid items-end gap-6 border-b-4 border-dark pb-8 lg:grid-cols-[1fr_auto]'>
          <div className='max-w-3xl'>
            <div className='mb-4 inline-flex items-center gap-2 rounded-lg border-2 border-dark bg-secondary px-3 py-1.5 text-sm font-black uppercase shadow-brutal-sm'>
              <LightBulbIcon className='h-4 w-4' aria-hidden />
              Idea workshop
            </div>
            <h1 className='text-4xl font-black leading-tight sm:text-5xl'>
              Three directions worth building.
            </h1>
            <p className='mt-3 max-w-2xl text-lg font-semibold text-gray-600'>
              Tell us what you care about and what you can use. You will get a
              short list with enough scope to start, not fifty vague prompts.
            </p>
          </div>
          <Link
            href='/dashboard'
            className='font-black underline decoration-2 underline-offset-4 hover:text-accentDark'
          >
            Back to dashboard
          </Link>
        </div>

        <div className='grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start'>
          <form
            onSubmit={handleGenerate}
            aria-busy={generating}
            className='rounded-2xl border-4 border-dark bg-white p-5 shadow-brutal sm:p-7 lg:sticky lg:top-28'
          >
            <fieldset disabled={generating} className='contents'>
            <h2 className='text-2xl font-black'>Set the brief</h2>
            <p className='mb-6 mt-1 text-sm font-semibold text-gray-600'>
              Specific inputs produce more useful project scopes.
            </p>

            <label htmlFor='idea-interests' className='mb-2 block font-black'>
              Interests or problems
            </label>
            <textarea
              id='idea-interests'
              rows={4}
              maxLength={1_000}
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
              placeholder='Local communities, accessible learning, personal finance...'
              className='mb-5 w-full resize-y rounded-xl border-2 border-dark bg-bgMain px-4 py-3 font-semibold shadow-brutal-sm'
            />

            <label htmlFor='idea-technologies' className='mb-2 block font-black'>
              Technologies
            </label>
            <input
              id='idea-technologies'
              value={technologies}
              onChange={(event) => setTechnologies(event.target.value)}
              placeholder='Next.js, PostgreSQL, TypeScript'
              className='mb-5 min-h-11 w-full rounded-xl border-2 border-dark bg-bgMain px-4 py-3 font-semibold shadow-brutal-sm'
            />

            <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
              <div>
                <label htmlFor='idea-experience' className='mb-2 block font-black'>
                  Experience
                </label>
                <select
                  id='idea-experience'
                  value={experience}
                  onChange={(event) =>
                    setExperience(event.target.value as typeof experience)
                  }
                  className='min-h-11 w-full rounded-xl border-2 border-dark bg-white px-3 py-2 font-bold shadow-brutal-sm'
                >
                  <option value='beginner'>Beginner</option>
                  <option value='intermediate'>Intermediate</option>
                  <option value='advanced'>Advanced</option>
                </select>
              </div>
            </div>

            <Button type='submit' fullWidth disabled={generating}>
              <SparklesIcon className='h-5 w-5' aria-hidden />
              {generating ? 'Generating ideas...' : 'Generate three ideas'}
            </Button>
            </fieldset>
            <p className='mt-3 text-xs font-semibold leading-relaxed text-gray-500'>
              These fields are sent to OpenRouter according to the server&apos;s data
              collection policy. Limits: 5 generations per hour and 15 per day.
            </p>
            {error && (
              <p role='alert' className='mt-4 font-bold text-red-600'>
                {error}
              </p>
            )}
            <p role='status' aria-live='polite' className='sr-only'>
              {generationStatus}
            </p>
          </form>

          <section aria-labelledby='idea-results-heading'>
            <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
              <div>
                <h2 id='idea-results-heading' className='text-2xl font-black'>
                  Your shortlist
                </h2>
              </div>
              {ideas.length > 0 && (
                <button
                  type='button'
                  onClick={() => {
                    setIdeas([])
                    setGenerationStatus('Idea results cleared.')
                  }}
                  className='min-h-11 font-bold underline decoration-2 underline-offset-4'
                >
                  Clear results
                </button>
              )}
            </div>

            {ideas.length === 0 ? (
              <div className='rounded-2xl border-4 border-dashed border-dark bg-accentSoft p-8 text-center sm:p-12'>
                <LightBulbIcon className='mx-auto h-12 w-12' aria-hidden />
                <p className='mt-4 text-xl font-black'>No generic idea wall.</p>
                <p className='mx-auto mt-2 max-w-md font-semibold text-gray-600'>
                  Complete the brief and generate a focused shortlist. Each result
                  can prefill a new project form.
                </p>
              </div>
            ) : (
              <div className='space-y-6' aria-live='polite'>
                {ideas.map((idea, index) => (
                  <article
                    key={`${idea.title}-${index}`}
                    className={`rounded-2xl border-4 border-dark p-5 shadow-brutal sm:p-7 ${cardColors[index % cardColors.length]}`}
                  >
                    <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
                      <div>
                        <p className='mb-1 text-sm font-black uppercase'>
                          Direction {index + 1}
                        </p>
                        <h3 className='text-2xl font-black leading-tight'>
                          {idea.title}
                        </h3>
                      </div>
                      <span className='rounded-lg border-2 border-dark bg-white px-3 py-1 text-xs font-black shadow-brutal-sm'>
                        {idea.category}
                      </span>
                    </div>
                    <p className='text-lg font-black'>{idea.summary}</p>
                    <p className='mt-3 font-semibold leading-relaxed text-dark/80'>
                      {idea.description}
                    </p>
                    {idea.technologies.length > 0 && (
                      <div className='mt-5 flex flex-wrap gap-2'>
                        {idea.technologies.map((technology) => (
                          <span
                            key={technology}
                            className='rounded-md border-2 border-dark bg-white px-2 py-1 text-xs font-bold'
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      href={ideaHref(idea)}
                      className='mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-dark bg-dark px-4 py-2 font-black text-white shadow-brutal-sm hover:bg-accentDark'
                    >
                      Start this project
                      <ArrowRightIcon className='h-4 w-4' aria-hidden />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default IdeasClient
