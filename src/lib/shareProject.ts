export interface ShareProjectInput {
  title: string
  description: string
  url: string
}

export const shareProject = async ({
  title,
  description,
  url,
}: ShareProjectInput): Promise<'shared' | 'copied'> => {
  if (navigator.share) {
    await navigator.share({ title, text: description, url })
    return 'shared'
  }
  if (!navigator.clipboard?.writeText) {
    throw new Error('Sharing is unavailable')
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}
