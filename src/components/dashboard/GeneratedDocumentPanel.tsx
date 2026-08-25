'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AiGenerationProgress from '@/components/dashboard/AiGenerationProgress'
import Button from '@/components/ui/Button'
import { copyText, downloadText } from '@/lib/documentUtils'

export type DocumentStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'cancelled'

interface GeneratedDocumentPanelProps {
  title: string
  description: string
  filename: string
  text: string
  status: DocumentStatus
  error: string
  onChange: (value: string) => void
  onGenerate: () => void
  onCancel: () => void
}

const GeneratedDocumentPanel = ({
  title,
  description,
  filename,
  text,
  status,
  error,
  onChange,
  onGenerate,
  onCancel,
}: GeneratedDocumentPanelProps) => {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previousStatusRef = useRef(status)
  const [actionStatus, setActionStatus] = useState('')

  useEffect(() => {
    if (
      previousStatusRef.current === 'loading' &&
      status === 'success' &&
      (!document.activeElement || document.activeElement === document.body)
    ) {
      editorRef.current?.focus()
    }
    previousStatusRef.current = status
  }, [status])

  const handleCopy = async () => {
    try {
      await copyText(text)
      setActionStatus(`${title} copied to the clipboard.`)
    } catch {
      setActionStatus('Copy failed. Select the document text and copy it manually.')
    }
  }

  const handleGenerate = () => {
    setActionStatus('')
    onGenerate()
  }

  const handleDownload = () => {
    downloadText(filename, text)
    setActionStatus(`${filename} downloaded.`)
  }

  return (
    <div
      aria-busy={status === 'loading'}
      className='min-w-0 rounded-2xl border-4 border-dark bg-white p-4 shadow-brutal sm:p-6'
    >
      <div className='mb-5 flex items-start gap-3'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-dark bg-primary shadow-brutal-sm'>
          <DocumentTextIcon className='h-5 w-5' aria-hidden />
        </div>
        <div className='min-w-0'>
          <h3 className='text-xl font-black'>{title}</h3>
          <p className='mt-1 max-w-2xl font-semibold text-gray-600'>{description}</p>
        </div>
      </div>

      {status === 'loading' && (
        <AiGenerationProgress
          label={`Drafting ${title}. This can take up to a minute.`}
          onCancel={onCancel}
        />
      )}

      {(status === 'error' || status === 'cancelled') && (
        <div className='rounded-xl border-2 border-dark bg-dangerSoft p-4'>
          <p role='alert' className='font-bold'>
            {error || `${title} generation was cancelled.`}
          </p>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            onClick={handleGenerate}
            className='mt-3 min-h-11'
          >
            <ArrowPathIcon className='h-4 w-4' aria-hidden />
            Retry {title}
          </Button>
        </div>
      )}

      {status !== 'loading' && !text && status === 'idle' && (
        <div className='rounded-xl border-2 border-dashed border-dark bg-bgMain p-5'>
          <p className='font-semibold text-gray-700'>
            Generate this document when you need it. Each successful draft uses
            one generation from your quota.
          </p>
          <Button
            type='button'
            onClick={handleGenerate}
            className='mt-4 min-h-11'
          >
            <DocumentTextIcon className='h-5 w-5' aria-hidden />
            Generate {title}
          </Button>
        </div>
      )}

      {(text || status === 'success') && (
        <div className={status === 'loading' ? 'mt-5 opacity-60' : 'mt-5'}>
          <div className='mb-3 flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              disabled={status === 'loading'}
              onClick={handleGenerate}
              className='min-h-11'
            >
              <ArrowPathIcon className='h-4 w-4' aria-hidden />
              Regenerate
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={status === 'loading' || !text}
              onClick={() => editorRef.current?.focus()}
              className='min-h-11'
            >
              <PencilSquareIcon className='h-4 w-4' aria-hidden />
              Edit draft
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={status === 'loading' || !text}
              onClick={() => void handleCopy()}
              className='min-h-11'
            >
              <ClipboardDocumentIcon className='h-4 w-4' aria-hidden />
              Copy Markdown
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={status === 'loading'}
              onClick={handleDownload}
              className='min-h-11'
            >
              <ArrowDownTrayIcon className='h-4 w-4' aria-hidden />
              Download
            </Button>
          </div>
          <label htmlFor={`document-${filename}`} className='sr-only'>
            Edit {title} Markdown
          </label>
          <textarea
            ref={editorRef}
            id={`document-${filename}`}
            rows={20}
            value={text}
            disabled={status === 'loading'}
            onChange={(event) => {
              onChange(event.target.value)
              setActionStatus('Draft edited in this browser session.')
            }}
            className='input-brutal w-full resize-y rounded-xl border-2 border-dark bg-bgMain px-4 py-3 font-mono text-sm font-medium leading-relaxed shadow-brutal-sm disabled:cursor-wait'
          />
          <p className='mt-2 text-xs font-semibold text-gray-600'>
            Session only. Copy or download the Markdown before leaving this page.
          </p>
        </div>
      )}

      {(actionStatus || status === 'success') && (
        <p
          role='status'
          aria-live='polite'
          className='mt-3 text-sm font-bold text-gray-700'
        >
          {actionStatus || `${title} is ready. Review and edit the draft.`}
        </p>
      )}
    </div>
  )
}

export default GeneratedDocumentPanel
