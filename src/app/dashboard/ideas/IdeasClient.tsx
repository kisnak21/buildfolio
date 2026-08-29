'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, LightBulbIcon } from '@heroicons/react/24/solid'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AiGenerationProgress from '@/components/dashboard/AiGenerationProgress'
import AiQuotaStatus from '@/components/dashboard/AiQuotaStatus'
import AiRetryCountdown from '@/components/dashboard/AiRetryCountdown'
import IdeaWorkspace from '@/components/dashboard/IdeaWorkspace'
import Button from '@/components/ui/Button'
import type { AiIdea } from '@/lib/aiModels'
import { aiResponseMessage, retryAfterSecondsFrom } from '@/lib/aiErrors'
import {
  generateAiContent,
  getAiQuota,
  type AiIdeasStreamEvent,
  type AiQuotaSnapshot,
} from '@/lib/api/aiApi'

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
  const [ideas, setIdeas] = useState<AiIdea[]>([])
  const [error, setError] = useState('')
  const [generationStatus, setGenerationStatus] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null)
  const [ideaBatch, setIdeaBatch] = useState(0)
  const [quota, setQuota] = useState<AiQuotaSnapshot | null>(null)
  const [progressLabel, setProgressLabel] = useState('')
  const [lastOutcome, setLastOutcome] = useState<'idle' | 'failed' | 'cancelled'>(
    'idle',
  )
  const [retryWaitSeconds, setRetryWaitSeconds] = useState(0)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let active = true
    getAiQuota()
      .then((snapshot) => {
        if (active) setQuota(snapshot)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const applyQuotaEvent = (data: Record<string, unknown>) => {
    const readWindow = (value: unknown) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        typeof (value as Record<string, unknown>).remaining !== 'number' ||
        typeof (value as Record<string, unknown>).limit !== 'number'
      ) {
        return undefined
      }
      const window = value as { remaining: number; limit: number }
      return { remaining: window.remaining, limit: window.limit }
    }
    const hourly = readWindow(data.hourly)
    const daily = readWindow(data.daily)
    if (hourly && daily) setQuota({ hourly, daily })
  }

  const refreshQuota = async () => {
    try {
      setQuota(await getAiQuota())
    } catch {
      // Quota display is informational; generation errors surface separately.
    }
  }

  const runGeneration = async () => {
    const technologyList = technologies
      .split(',')
      .map((technology) => technology.trim())
      .filter(Boolean)

    if (!interests.trim() && technologyList.length === 0) {
      setError('Add an interest or at least one technology.')
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setGenerating(true)
    setError('')
    setRetryWaitSeconds(0)
    setLastOutcome('idle')
    setProgressLabel('Connecting to the AI service.')
    try {
      const result = await generateAiContent(
        'ideas',
        undefined,
        {
          interests: interests.trim() || undefined,
          technologies: technologyList,
        },
        {
          signal: controller.signal,
          onEvent: (event: AiIdeasStreamEvent) => {
            if (event.event === 'meta' && typeof event.data.model === 'string') {
              const attempt =
                typeof event.data.attempt === 'number' ? event.data.attempt : 1
              const total =
                typeof event.data.total === 'number' ? event.data.total : 1
              setProgressLabel(`Contacting model ${attempt} of ${total}.`)
            } else if (event.event === 'fallback') {
              setProgressLabel('The first model stalled. Switching to a backup.')
            } else if (event.event === 'progress') {
              setProgressLabel('Drafting your three ideas.')
            } else if (event.event === 'quota') {
              applyQuotaEvent(event.data)
            }
          },
        },
      )
      if (result.task === 'ideas') {
        setIdeas(result.ideas)
        setSelectedIdeaIndex(null)
        setIdeaBatch((current) => current + 1)
        setGenerationStatus('Three project ideas generated.')
        void refreshQuota()
      }
    } catch (requestError) {
      if (controller.signal.aborted) {
        setLastOutcome('cancelled')
        setGenerationStatus('Idea generation cancelled.')
      } else {
        const seconds = retryAfterSecondsFrom(requestError)
        setRetryWaitSeconds(seconds)
        setError(
          aiResponseMessage(
            requestError,
            'Could not generate ideas. Please try again.',
          ),
        )
        setGenerationStatus(
          seconds > 0
            ? `Rate limited. Retry available in ${seconds} seconds.`
            : 'Idea generation failed.',
        )
        setLastOutcome('failed')
      }
    } finally {
      abortRef.current = null
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
            onSubmit={(event) => {
              event.preventDefault()
              void runGeneration()
            }}
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

              <label
                htmlFor='idea-technologies'
                className='mb-2 block font-black'
              >
                Technologies
              </label>
              <input
                id='idea-technologies'
                value={technologies}
                onChange={(event) => setTechnologies(event.target.value)}
                placeholder='Next.js, PostgreSQL, TypeScript'
                className='mb-5 min-h-11 w-full rounded-xl border-2 border-dark bg-bgMain px-4 py-3 font-semibold shadow-brutal-sm'
              />

              <Button
                type='submit'
                fullWidth
                disabled={generating || retryWaitSeconds > 0}
              >
                <LightBulbIcon className='h-5 w-5' aria-hidden />
                {generating ? 'Generating ideas...' : 'Generate three ideas'}
              </Button>
            </fieldset>
            {generating && (
              <div className='mt-4'>
                <AiGenerationProgress
                  label={progressLabel}
                  onCancel={() => abortRef.current?.abort()}
                />
              </div>
            )}
            {!generating && lastOutcome !== 'idle' && (
              <div className='mt-4'>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={() => void runGeneration()}
                  className='min-h-11 w-full'
                >
                  Retry generation
                </Button>
              </div>
            )}
            {quota && (
              <div className='mt-3'>
                <AiQuotaStatus hourly={quota.hourly} daily={quota.daily} />
              </div>
            )}
            <p className='mt-3 text-xs font-semibold leading-relaxed text-gray-500'>
              These fields are sent to the configured AI provider. Limits: 5
              generations per hour and 15 per day. Cancelled or failed runs do
              not consume quota.
            </p>
            {error && (
              <p role='alert' className='mt-4 font-bold text-red-600'>
                {error}
              </p>
            )}
            {retryWaitSeconds > 0 && (
              <div className='mt-2'>
                <AiRetryCountdown
                  seconds={retryWaitSeconds}
                  onFinished={() => setRetryWaitSeconds(0)}
                />
              </div>
            )}
            <p role='status' aria-live='polite' className='sr-only'>
              {generationStatus}
            </p>
          </form>

          <section aria-labelledby='idea-results-heading'>
            <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
              <h2 id='idea-results-heading' className='text-2xl font-black'>
                Your shortlist
              </h2>
              {ideas.length > 0 && (
                <button
                  type='button'
                  onClick={() => {
                    setIdeas([])
                    setSelectedIdeaIndex(null)
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
                  Complete the brief and generate a focused shortlist. Each
                  result can prefill a new project form.
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
                    <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
                      <Button
                        type='button'
                        variant='secondary'
                        aria-pressed={selectedIdeaIndex === index}
                        onClick={() => {
                          setSelectedIdeaIndex(index)
                          requestAnimationFrame(() => {
                            const heading =
                              workspaceRef.current?.querySelector<HTMLElement>(
                                '[data-workspace-heading]',
                              )
                            heading?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            })
                            heading?.focus({ preventScroll: true })
                          })
                        }}
                        className='min-h-11'
                      >
                        <LightBulbIcon className='h-5 w-5' aria-hidden />
                        {selectedIdeaIndex === index
                          ? 'Package selected'
                          : 'Build project package'}
                      </Button>
                      <Link
                        href={ideaHref(idea)}
                        className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-dark bg-dark px-4 py-2 font-black text-white shadow-brutal-sm hover:bg-accentDark'
                      >
                        Start this project
                        <ArrowRightIcon className='h-4 w-4' aria-hidden />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        <div ref={workspaceRef}>
          <IdeaWorkspace
            idea={selectedIdeaIndex === null ? null : ideas[selectedIdeaIndex]}
            ideaKey={
              selectedIdeaIndex === null || !ideas[selectedIdeaIndex]
                ? null
                : `${ideaBatch}:${selectedIdeaIndex}:${ideas[selectedIdeaIndex].title}`
            }
            onQuotaSpent={() => void refreshQuota()}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default IdeasClient
