import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Buildfolio privacy policy — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-3xl mx-auto px-4 py-12 w-full'>
        <div className='mb-10'>
          <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
            Privacy Policy
          </h1>
          <p className='text-sm text-gray-400'>Last updated: July 2026</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-8 text-sm text-gray-600 leading-relaxed'>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              1. Information We Collect
            </h2>
            <p>
              When you create an account on Buildfolio, we collect your name,
              email address, and password. When you submit a project, we collect
              project details including title, description, GitHub URL, and live
              URL. We also collect usage data such as likes, bookmarks, and
              comments you create on the platform.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              2. How We Use Your Information
            </h2>
            <p>
              We use your information to provide and improve the Buildfolio
              platform, authenticate your identity, display your projects and
              profile to other users, and send account-related emails such as
              email verification. We do not sell your personal data to third
              parties.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              3. Data Storage
            </h2>
            <p>
              Your data is stored securely in a PostgreSQL database hosted on
              Neon. Passwords are hashed using bcrypt before storage and are
              never stored or transmitted in plain text.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              4. Cookies and Local Storage
            </h2>
            <p>
              Buildfolio uses browser localStorage to maintain your login
              session and store bookmarks. We do not use tracking cookies or
              third-party analytics services.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              5. Your Rights
            </h2>
            <p>
              You may delete your account at any time via the Dashboard
              settings. Deleting your account will permanently remove your
              profile and all projects you have submitted.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              6. Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              via the{' '}
              <a
                href='/contact'
                className='text-primary hover:text-primary-hover transition-colors'
              >
                Contact page
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
