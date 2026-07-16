import type { Metadata } from 'next'
import SettingsClient from './SettingsClient'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Update your Buildfolio profile settings.',
}

export default function SettingsPage() {
  return <SettingsClient />
}
