import type { Metadata } from 'next'
import EditProjectClient from './EditProjectClient'

export const metadata: Metadata = {
  title: 'Edit Project',
  description: 'Update your project details on Buildfolio.',
}

export default function EditProjectPage() {
  return <EditProjectClient />
}
