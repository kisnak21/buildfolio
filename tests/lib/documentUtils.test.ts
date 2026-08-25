import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  copyText,
  documentFilename,
  downloadText,
} from '@/lib/documentUtils'

describe('document utilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates safe, task-specific Markdown filenames', () => {
    expect(documentFilename('Community Data Notebook!', 'prd')).toBe(
      'community-data-notebook-prd.md',
    )
    expect(documentFilename('Déjà Vu', 'design')).toBe(
      'deja-vu-design-spec.md',
    )
    expect(documentFilename('Project', 'styleGuide')).toBe(
      'project-style-guide.md',
    )
    expect(documentFilename('Any project', 'readme')).toBe('README.md')
  })

  it('copies text through the Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyText('# PRD')

    expect(writeText).toHaveBeenCalledWith('# PRD')
  })

  it('downloads UTF-8 Markdown and cleans up its object URL', async () => {
    const click = vi.fn()
    const anchor = { href: '', download: '', click }
    const createObjectURL = vi.fn().mockReturnValue('blob:document')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor) })
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    downloadText('project-prd.md', '# PRD')

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/markdown;charset=utf-8')
    expect(await blob.text()).toBe('# PRD')
    expect(anchor).toMatchObject({
      href: 'blob:document',
      download: 'project-prd.md',
    })
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:document')
  })
})
