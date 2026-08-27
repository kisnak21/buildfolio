export interface RawProject {
  id: string | number
  title: string
  slug: string
  description: string
  thumbnail?: string | null
  github_url?: string
  github?: string
  live_url?: string
  live?: string
  category_name?: string
  category?: string
  technologies?: string[]
  author_name?: string
  author?: string
  likes?: number
  status?: 'DRAFT' | 'PUBLISHED'
  user_id?: string | number | null
  category_id?: string | number | null
  featured_at?: string | null
  hidden_at?: string | null
  hidden_reason?: string | null
  created_at?: string | null
  createdAt?: string | null
}

export interface ClientProject {
  id: string | number
  title: string
  slug: string
  description: string
  thumbnail: string | null
  github: string
  live: string
  category: string
  technologies: string[]
  author: string
  likes: number
  status: 'DRAFT' | 'PUBLISHED'
  user_id: string | number | null
  category_id: string | number | null
  featuredAt: string | null
  hiddenAt: string | null
  hiddenReason: string | null
  createdAt: string | null
}

export const toClientProject = (p: RawProject): ClientProject => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  description: p.description,
  thumbnail: p.thumbnail || null,
  github: p.github_url || p.github || '#',
  live: p.live_url || p.live || '#',
  category: p.category_name || p.category || '',
  technologies: Array.isArray(p.technologies) ? p.technologies : [],
  author: p.author_name || p.author || '',
  likes: p.likes || 0,
  status: p.status || 'PUBLISHED',
  user_id: p.user_id || null,
  category_id: p.category_id || null,
  featuredAt: p.featured_at || null,
  hiddenAt: p.hidden_at || null,
  hiddenReason: p.hidden_reason || null,
  createdAt: p.created_at || p.createdAt || null,
})
