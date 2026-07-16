import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Buildfolio terms of service — the rules and guidelines for using the platform.',
}

export default function TermsPage() {
  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-3xl mx-auto px-4 py-12 w-full'>
        <div className='mb-10'>
          <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
            Terms of Service
          </h1>
          <p className='text-sm text-gray-400'>Last updated: July 2026</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-8 text-sm text-gray-600 leading-relaxed'>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Buildfolio, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use the platform.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              2. User Accounts
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials. You must not share your password with others or use
              another user's account. You are responsible for all activity that
              occurs under your account.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              3. Content Guidelines
            </h2>
            <p>
              You may only submit projects that you own or have the right to
              share. You must not submit content that is illegal, harmful,
              offensive, or infringes on the intellectual property rights of
              others. Buildfolio reserves the right to remove any content that
              violates these guidelines.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              4. Intellectual Property
            </h2>
            <p>
              You retain ownership of the projects and content you submit to
              Buildfolio. By submitting content, you grant Buildfolio a
              non-exclusive license to display your content on the platform.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              5. Limitation of Liability
            </h2>
            <p>
              Buildfolio is provided as is without warranties of any kind. We
              are not liable for any damages arising from your use of the
              platform, including loss of data or interruption of service.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              6. Changes to Terms
            </h2>
            <p>
              We may update these Terms of Service from time to time. Continued
              use of the platform after changes are made constitutes acceptance
              of the new terms.
            </p>
          </section>
          <section>
            <h2 className='text-base font-semibold text-gray-900 mb-2'>
              7. Contact
            </h2>
            <p>
              If you have questions about these Terms, please contact us via the{' '}
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
