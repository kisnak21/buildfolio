import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Buildfolio.',
}

const faqs = [
  {
    question: 'What is Buildfolio?',
    answer:
      'Buildfolio is a platform for developers to discover projects, share ideas, and build their portfolio. Think of it as a combination of GitHub Explore, Product Hunt, and Dev.to — focused entirely on developer project showcases.',
  },
  {
    question: 'How do I submit a project?',
    answer:
      'Create an account or log in, then click "Submit Project" from the homepage or navigate to your Dashboard and click "+ New Project". Fill in your project details and submit.',
  },
  {
    question: 'Is Buildfolio free to use?',
    answer:
      'Yes, Buildfolio is completely free. Create an account and start showcasing your projects immediately.',
  },
  {
    question: 'Can I edit or delete my projects?',
    answer:
      'Yes. Go to your Dashboard to view all your projects. From there you can edit or delete any project you own.',
  },
  {
    question: 'How do likes work?',
    answer:
      'Any visitor can like a project by clicking the heart icon on a project card or detail page. Likes are counted and used to surface popular projects in the Community Favorites section.',
  },
  {
    question: 'What is the bookmark feature?',
    answer:
      'Logged-in users can bookmark projects they want to save for later. Access all your bookmarked projects from your account dropdown menu.',
  },
  {
    question: 'How do I verify my email?',
    answer:
      'After registering, a verification email is sent to your inbox. Click the link in the email to verify your account. Check your spam folder if you do not see it.',
  },
  {
    question: 'Can I upload images for my project?',
    answer:
      'Yes. When creating or editing a project, you can upload a thumbnail image. Supported formats are JPEG, PNG, GIF, and WebP up to 4MB.',
  },
]

export default function FAQPage() {
  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-3xl mx-auto px-4 py-12 w-full'>
        <div className='mb-10'>
          <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
            Frequently Asked Questions
          </h1>
          <p className='text-sm text-gray-500'>
            Everything you need to know about Buildfolio.
          </p>
        </div>
        <div className='flex flex-col gap-4'>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className='bg-white border border-gray-200 rounded-xl p-6'
            >
              <h2 className='text-sm font-semibold text-gray-900 mb-2'>
                {faq.question}
              </h2>
              <p className='text-sm text-gray-500 leading-relaxed'>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
