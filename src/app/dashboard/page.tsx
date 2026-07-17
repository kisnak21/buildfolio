import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your Buildfolio projects.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
