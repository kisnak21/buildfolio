'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, FolderOpenIcon } from '@heroicons/react/24/solid'
import GeneratedDocumentPanel, {
  type DocumentStatus,
} from '@/components/dashboard/GeneratedDocumentPanel'
import { documentFilename } from '@/lib/documentUtils'
import type { AiDocumentTask, AiIdea } from '@/lib/aiModels'
import { generateAiContent } from '@/lib/api/aiApi'

const DOCUMENTS: Array<{
  task: AiDocumentTask
  label: string
  description: string
}> = [
  {
    task: 'prd',
    label: 'PRD',
    description: 'Define the problem, users, MVP scope, requirements, and risks.',
  },
  {
    task: 'design',
    label: 'Design Spec',
    description: 'Map screens, flows, responsive behavior, states, and accessibility.',
  },
  {
    task: 'styleGuide',
    label: 'Style Guide',
    description: 'Set practical color, type, spacing, component, and state guidance.',
  },
  {
    task: 'readme',
    label: 'README',
    description: 'Prepare repository documentation with factual setup placeholders.',
  },
]

interface DocumentDraft {
  text: string
  status: DocumentStatus
  error: string
}

type IdeaDocuments = Record<AiDocumentTask, DocumentDraft>

const emptyDocuments = (): IdeaDocuments => ({
  prd: { text: '', status: 'idle', error: '' },
  design: { text: '', status: 'idle', error: '' },
  styleGuide: { text: '', status: 'idle', error: '' },
  readme: { text: '', status: 'idle', error: '' },
})

const ideaHref = (idea: AiIdea) => {
  const params = new URLSearchParams({
    title: idea.title,
    description: idea.description,
    category: idea.category,
    technologies: idea.technologies.join(', '),
  })
  return `/dashboard/new?${params.toString()}`
}

interface IdeaWorkspaceProps {
  idea: AiIdea | null
  ideaKey: string | null
}

const IdeaWorkspace = ({ idea, ideaKey }: IdeaWorkspaceProps) => {
  const [activeTask, setActiveTask] = useState<AiDocumentTask>('prd')
  const [documentsByIdea, setDocumentsByIdea] = useState<
    Record<string, IdeaDocuments>
  >({})
  const [activeRequest, setActiveRequest] = useState<{
    ideaKey: string
    task: AiDocumentTask
  } | null>(null)
  const requestRef = useRef<{
    ideaKey: string
    task: AiDocumentTask
    controller: AbortController
  } | null>(null)
  const previousIdeaKey = useRef<string | null>(null)

  useEffect(() => {
    if (
      previousIdeaKey.current &&
      previousIdeaKey.current !== ideaKey &&
      requestRef.current?.ideaKey === previousIdeaKey.current
    ) {
      requestRef.current.controller.abort()
    }
    previousIdeaKey.current = ideaKey
  }, [ideaKey])

  useEffect(
    () => () => {
      requestRef.current?.controller.abort()
    },
    [],
  )

  const documents = ideaKey
    ? documentsByIdea[ideaKey] ?? emptyDocuments()
    : emptyDocuments()
  const activeDocument = DOCUMENTS.find(({ task }) => task === activeTask)!
  const draft = documents[activeTask]

  const updateDraft = (
    key: string,
    task: AiDocumentTask,
    update: Partial<DocumentDraft>,
  ) => {
    setDocumentsByIdea((current) => {
      const ideaDocuments = current[key] ?? emptyDocuments()
      return {
        ...current,
        [key]: {
          ...ideaDocuments,
          [task]: { ...ideaDocuments[task], ...update },
        },
      }
    })
  }

  const generateDocument = async () => {
    if (!idea || !ideaKey || requestRef.current) return
    const controller = new AbortController()
    requestRef.current = { ideaKey, task: activeTask, controller }
    setActiveRequest({ ideaKey, task: activeTask })
    updateDraft(ideaKey, activeTask, {
      status: 'loading',
      error: '',
    })

    try {
      const result = await generateAiContent(
        activeTask,
        undefined,
        {
          title: idea.title,
          summary: idea.summary,
          description: idea.description,
          category: idea.category,
          technologies: idea.technologies,
        },
        { signal: controller.signal },
      )
      if (result.task === 'ideas' || result.task !== activeTask) {
        throw new Error('AI returned the wrong document type.')
      }
      updateDraft(ideaKey, activeTask, {
        text: result.text,
        status: 'success',
        error: '',
      })
    } catch (requestError) {
      if (controller.signal.aborted) {
        updateDraft(ideaKey, activeTask, {
          status: 'cancelled',
          error: `${activeDocument.label} generation was cancelled.`,
        })
      } else {
        const apiError = requestError as {
          response?: { data?: { message?: string } }
          message?: string
        }
        updateDraft(ideaKey, activeTask, {
          status: 'error',
          error:
            apiError.response?.data?.message ||
            apiError.message ||
            `Could not generate ${activeDocument.label}. Please try again.`,
        })
      }
    } finally {
      if (requestRef.current?.controller === controller) {
        requestRef.current = null
        setActiveRequest(null)
      }
    }
  }

  const selectTab = (task: AiDocumentTask) => {
    if (activeRequest) return
    setActiveTask(task)
  }

  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? DOCUMENTS.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + DOCUMENTS.length) %
            DOCUMENTS.length
    const nextTask = DOCUMENTS[nextIndex].task
    selectTab(nextTask)
    document.getElementById(`document-tab-${nextTask}`)?.focus()
  }

  return (
    <section className='mt-12 border-t-4 border-dark pt-10' aria-labelledby='workspace-heading'>
      {!idea || !ideaKey ? (
        <div className='rounded-2xl border-4 border-dashed border-dark bg-white p-7 sm:p-10'>
          <FolderOpenIcon className='h-10 w-10' aria-hidden />
          <h2 id='workspace-heading' className='mt-4 text-3xl font-black'>
            Turn one idea into a project package.
          </h2>
          <p className='mt-2 max-w-2xl font-semibold text-gray-600'>
            Select Build project package on a shortlist item. You can then draft
            each document separately and keep editing it during this page session.
          </p>
        </div>
      ) : (
        <>
          <div className='mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end'>
            <div className='max-w-3xl'>
              <h2
                id='workspace-heading'
                data-workspace-heading
                tabIndex={-1}
                className='text-3xl font-black leading-tight sm:text-4xl'
              >
                Project package for {idea.title}
              </h2>
              <p className='mt-2 text-lg font-bold'>{idea.summary}</p>
              <p className='mt-2 font-semibold text-gray-600'>
                Generate only what you need. Drafts stay in this browser tab and
                are not saved to your account.
              </p>
            </div>
            <Link
              href={ideaHref(idea)}
              className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-dark bg-dark px-4 py-2 font-black text-white shadow-brutal-sm hover:bg-accentDark'
            >
              Open project form
              <ArrowRightIcon className='h-4 w-4' aria-hidden />
            </Link>
          </div>

          <div
            role='tablist'
            aria-label='Project documents'
            className='mb-4 flex flex-wrap gap-2'
          >
            {DOCUMENTS.map((document, index) => (
              <button
                key={document.task}
                id={`document-tab-${document.task}`}
                type='button'
                role='tab'
                aria-selected={activeTask === document.task}
                aria-controls='document-panel'
                tabIndex={activeTask === document.task ? 0 : -1}
                disabled={activeRequest !== null}
                onClick={() => selectTab(document.task)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`min-h-11 rounded-lg border-2 border-dark px-4 py-2 font-black disabled:cursor-wait disabled:opacity-60 ${
                  activeTask === document.task
                    ? 'bg-secondary shadow-brutal-sm'
                    : 'bg-white hover:bg-inputBg'
                }`}
              >
                {document.label}
              </button>
            ))}
          </div>

          <div
            id='document-panel'
            role='tabpanel'
            aria-labelledby={`document-tab-${activeTask}`}
          >
            <GeneratedDocumentPanel
              key={`${ideaKey}-${activeTask}`}
              title={activeDocument.label}
              description={activeDocument.description}
              filename={documentFilename(idea.title, activeTask)}
              text={draft.text}
              status={draft.status}
              error={draft.error}
              onChange={(text) =>
                updateDraft(ideaKey, activeTask, {
                  text,
                  status: 'success',
                })
              }
              onGenerate={() => void generateDocument()}
              onCancel={() => requestRef.current?.controller.abort()}
            />
          </div>
        </>
      )}
    </section>
  )
}

export default IdeaWorkspace
