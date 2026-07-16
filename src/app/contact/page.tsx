import type { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Get in touch with the Buildfolio team.',
}

export default function ContactPage() {
  return <ContactClient />
}
