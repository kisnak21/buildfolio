import type { Metadata } from 'next'
import AuditLogsClient from './AuditLogsClient'

export const metadata: Metadata = {
  title: 'Audit Logs',
  robots: { index: false, follow: false },
}

const AuditLogsPage = () => {
  return <AuditLogsClient />
}

export default AuditLogsPage