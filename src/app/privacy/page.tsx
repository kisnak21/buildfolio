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
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-3xl mx-auto px-4 py-12 w-full'>
        <div className='mb-10 border-b-4 border-dark pb-6'>
          <h1 className='text-4xl font-black mb-2'>
            Privacy Policy
          </h1>
          <p className='font-bold text-gray-600 text-lg'>Last updated: August 2026</p>
        </div>
        <div className='bg-white border-4 border-dark rounded-2xl p-8 flex flex-col gap-8 shadow-brutal'>
          <section>
            <h2 className='text-2xl font-black text-dark mb-3'>
              1. Information We Collect
            </h2>
            <p className='font-medium text-gray-700 leading-relaxed'>
              When you create an account on Buildfolio, we collect your name,
              email address, and password. When you submit a project, we collect
              project details including title, description, GitHub URL, and live
              URL. We also collect usage data such as likes, bookmarks, and
              comments you create on the platform.
            </p>
          </section>
          <section>
            <h2 className='text-2xl font-black text-dark mb-3'>
              2. How We Use Your Information
            </h2>
            <p className='font-medium text-gray-700 leading-relaxed'>
              We use your information to provide and improve the Buildfolio
              platform, authenticate your identity, display your projects and
              profile to other users, and send account-related emails such as
              email verification. We do not sell your personal data to third
              parties.
            </p>
          </section>
          <section>
            <h2 className='text-2xl font-black text-dark mb-3'>
              3. AI Writing Tools
            </h2>
            <p className='font-medium text-gray-700 leading-relaxed'>
              When you choose to generate a description, project idea, PRD, Design
              Spec, Style Guide, or README, the project fields shown in that
              workspace are sent to OpenRouter and an AI model provider to produce
              the requested draft. Generated project documents remain in the
              current page session unless you copy or download them. The provider
              data collection policy is configurable by the operator and defaults
              to the provider&apos;s normal policy so free models remain available.
              Do not enter passwords, API keys, or other sensitive personal data
              into AI-assisted fields.
            </p>
          </section>
          <section>
            <h2 className='text-2xl font-black text-dark mb-3'>
              4. Data Storage and Retention
            </h2>
            <p className='font-medium text-gray-700 leading-relaxed'>
              Your data is stored securely in a PostgreSQL database hosted on
              Neon. Passwords are hashed using bcrypt before storage and are
              never stored or transmitted in plain text. Encrypted database
              backups are retained for up to 14 days. Administrative audit logs
              and resolved content reports are removed according to the configured
              retention periods.
            </p>
          </section>
          <section>
            <h2 className='text-2xl font-black text-dark mb-3'>
              5. Cookies and Local Storage
            </h2>
            <p className='font-medium text-gray-700 leading-relaxed'>
              Buildfolio uses secure cookies to maintain your login session and
              browser localStorage to keep a non-sensitive copy of your displayed
              profile. Bookmarks are stored in the database. We do not use
              tracking cookies or third-party analytics services.
            </p>
          </section>
          <section>
            <h2 className='text-2xl font-black text-dark mb-3'>
              6. Your Rights
            </h2>
            <p className='font-medium text-gray-700 leading-relaxed'>
              You may delete your account at any time via the Dashboard
              settings. Deleting your account will permanently remove your
              profile and all projects you have submitted from the live database.
              Encrypted backup copies expire within the 14-day backup window.
            </p>
          </section>
          <section>
            <h2 className='text-2xl font-black text-dark mb-3'>
              7. Contact
            </h2>
            <p className='font-medium text-gray-700 leading-relaxed'>
              If you have questions about this Privacy Policy, please contact us
              via the{' '}
              <a
                href='/contact'
                className='text-primaryDark hover:underline font-bold'
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
