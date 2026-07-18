import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export const getAllProjects = async ({
  search,
  category,
  sort,
  page = 1,
  limit = 20,
}: {
  search?: string
  category?: string
  sort?: string
  page?: number
  limit?: number
} = {}) => {
  const conditions: string[] = []
  const values: string[] = []
  let paramIndex = 1

  if (search) {
    conditions.push(
      `(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`,
    )
    values.push(`%${search}%`)
    paramIndex++
  }

  if (category) {
    conditions.push(`c.name = $${paramIndex}`)
    values.push(category)
    paramIndex++
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const orderClause =
    sort === 'likes'
      ? 'ORDER BY p.likes DESC'
      : sort === 'oldest'
        ? 'ORDER BY p.created_at ASC'
        : sort === 'title'
          ? 'ORDER BY p.title ASC'
          : 'ORDER BY p.created_at DESC'

  const offset = (page - 1) * limit

  // Count total
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM projects p
     LEFT JOIN categories c ON p.category_id = c.id
     ${whereClause}`,
    values,
  )
  const total = parseInt(countResult.rows[0].count, 10)

  // Fetch page
  const result = await pool.query(
    `SELECT
      p.*,
      u.name as author_name,
      c.name as category_name,
      COALESCE(
        json_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        '[]'
      ) as technologies
     FROM projects p
     LEFT JOIN users u ON p.user_id = u.id
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN project_technologies pt ON p.id = pt.project_id
     LEFT JOIN technologies t ON pt.technology_id = t.id
     ${whereClause}
     GROUP BY p.id, u.name, c.name
     ${orderClause}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset],
  )

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getProjectById = async (id: string) => {
  const result = await pool.query(
    `SELECT
      p.*,
      u.name as author_name,
      c.name as category_name,
      COALESCE(
        json_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
        '[]'
      ) as technologies
     FROM projects p
     LEFT JOIN users u ON p.user_id = u.id
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN project_technologies pt ON p.id = pt.project_id
     LEFT JOIN technologies t ON pt.technology_id = t.id
     WHERE p.id = $1
     GROUP BY p.id, u.name, c.name`,
    [id],
  )
  return result.rows[0] || null
}

export const createProject = async ({
  title,
  slug,
  description,
  thumbnail,
  github_url,
  live_url,
  user_id,
  category_id,
}: {
  title: string
  slug: string
  description: string
  thumbnail?: string
  github_url?: string
  live_url?: string
  user_id: string
  category_id?: string
}) => {
  const id = uuidv4()
  const result = await pool.query(
    `INSERT INTO projects (id, title, slug, description, thumbnail, github_url, live_url, user_id, category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      title,
      slug,
      description,
      thumbnail || null,
      github_url || null,
      live_url || null,
      user_id,
      category_id || null,
    ],
  )
  return result.rows[0]
}

export const updateProject = async (
  id: string,
  {
    title,
    slug,
    description,
    thumbnail,
    github_url,
    live_url,
    category_id,
    likes,
  }: {
    title?: string
    slug?: string
    description?: string
    thumbnail?: string
    github_url?: string
    live_url?: string
    category_id?: string
    likes?: number
  },
) => {
  const result = await pool.query(
    `UPDATE projects
     SET title = COALESCE($1, title),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         thumbnail = COALESCE($4, thumbnail),
         github_url = COALESCE($5, github_url),
         live_url = COALESCE($6, live_url),
         category_id = COALESCE($7, category_id),
         likes = COALESCE($8, likes)
     WHERE id = $9
     RETURNING *`,
    [
      title || null,
      slug || null,
      description || null,
      thumbnail || null,
      github_url || null,
      live_url || null,
      category_id || null,
      likes ?? null,
      id,
    ],
  )
  return result.rows[0] || null
}

export const deleteProject = async (id: string) => {
  const result = await pool.query(
    'DELETE FROM projects WHERE id = $1 RETURNING id',
    [id],
  )
  return result.rows[0] || null
}
