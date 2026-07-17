import type { Metadata } from 'next'
import NewProjectClient from './NewProjectClient'

export const metadata: Metadata = {
  title: 'New Project',
  description: 'Add a new project to your Buildfolio portfolio.',
}

export default function NewProjectPage() {
  return <NewProjectClient />
}
