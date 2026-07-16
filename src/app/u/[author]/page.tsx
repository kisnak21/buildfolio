import type { Metadata } from 'next'
import UserProfileClient from './UserProfileClient'

export const metadata: Metadata = {
  title: 'User Profile',
  description: 'View developer profile on Buildfolio.',
}

export default function UserProfilePage() {
  return <UserProfileClient />
}
