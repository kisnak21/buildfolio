import type { Metadata } from 'next'
import NewProjectClient from './NewProjectClient'
import { PROJECT_CATEGORIES } from '@/lib/aiModels'

export const metadata: Metadata = {
  title: 'New Project',
  description: 'Add a new project to your Buildfolio portfolio.',
}

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const title = firstValue(params.title)?.trim().slice(0, 120)
  const description = firstValue(params.description)?.trim().slice(0, 10_000)
  const requestedCategory = firstValue(params.category)
  const category = PROJECT_CATEGORIES.includes(
    requestedCategory as (typeof PROJECT_CATEGORIES)[number],
  )
    ? requestedCategory
    : undefined
  const technologies = firstValue(params.technologies)
    ?.split(',')
    .map((technology) => technology.trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, 20)

  return (
    <NewProjectClient
      initialIdea={{ title, description, category, technologies }}
    />
  )
}
