import type { AiDocumentTask } from '@/lib/aiModels'
export { copyText } from '@/lib/utils'

export const documentFilename = (title: string, task: AiDocumentTask) => {
  if (task === 'readme') return 'README.md'
  const projectName = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'project'
  const suffix = task === 'styleGuide' ? 'style-guide' : task === 'design' ? 'design-spec' : 'prd'
  return `${projectName}-${suffix}.md`
}

export const downloadText = (
  filename: string,
  content: string,
  mimeType = 'text/markdown;charset=utf-8',
) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
