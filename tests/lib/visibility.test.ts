import { describe, expect, it } from 'vitest'
import { publicProjectWhere } from '@/lib/visibility'
import { toClientProject } from '@/lib/shapes'

describe('project visibility', () => {
  it('limits public projects to published projects owned by active users', () => {
    expect(publicProjectWhere()).toMatchObject({
      status: 'PUBLISHED',
      hiddenAt: null,
      user: {
        is: {
          bannedAt: null,
        },
      },
    })
  })

  it('normalizes project status for client consumers', () => {
    const project = toClientProject({
      id: 'project-1',
      title: 'Private draft',
      slug: 'private-draft',
      description: 'A project draft.',
      status: 'DRAFT',
    })

    expect(project.status).toBe('DRAFT')
  })
})
