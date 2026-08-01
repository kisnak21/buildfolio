import type { Metadata } from 'next'
import LikedClient from './LikedClient'

export const metadata: Metadata = {
  title: 'Liked Projects',
  description: 'Projects you have liked on Buildfolio.',
}

export default function LikedPage() {
  return <LikedClient />
}
