import pool from '@/lib/db'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import transporter from '@/lib/email'

const SALT_ROUNDS = 10

export const getAllUsers = async () => {
  const result = await pool.query(
    'SELECT id, name, username, email, image, bio, is_verified, created_at FROM users ORDER BY created_at DESC',
  )
  return result.rows
}

export const getUserById = async (id: string) => {
  const result = await pool.query(
    'SELECT id, name, username, email, image, bio, is_verified, created_at FROM users WHERE id = $1',
    [id],
  )
  return result.rows[0] || null
}

export const createUser = async ({
  name,
  email,
  password,
  image,
  bio,
}: {
  name: string
  email: string
  password: string
  image?: string
  bio?: string
}) => {
  const id = uuidv4()
  const username = name.toLowerCase().replace(/\s+/g, '')
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  const verificationToken = uuidv4()

  const result = await pool.query(
    `INSERT INTO users (id, name, username, email, password, image, bio, verification_token, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
     RETURNING id, name, username, email, image, bio, is_verified, created_at`,
    [
      id,
      name,
      username,
      email,
      hashedPassword,
      image || null,
      bio || null,
      verificationToken,
    ],
  )

  const user = result.rows[0]

  await transporter.sendMail({
    from: '"Buildfolio" <noreply@buildfolio.dev>',
    to: email,
    subject: 'Verify your Buildfolio account',
    html: `
      <h2>Welcome to Buildfolio, ${name}!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/verify-email?token=${verificationToken}">
        Verify Email
      </a>
    `,
  })

  return user
}

export const loginUserService = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ])
  const user = result.rows[0]
  if (!user) return null

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) return null

  const token = signToken({ id: user.id, email: user.email, name: user.name })

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      bio: user.bio,
      is_verified: user.is_verified,
    },
  }
}

export const verifyEmailService = async (token: string) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE verification_token = $1',
    [token],
  )
  const user = result.rows[0]
  if (!user) return null

  await pool.query(
    'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
    [user.id],
  )
  return user
}

export const updateUser = async (
  id: string,
  { name, image, bio }: { name?: string; image?: string; bio?: string },
) => {
  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         image = COALESCE($2, image),
         bio = COALESCE($3, bio)
     WHERE id = $4
     RETURNING id, name, username, email, image, bio, is_verified, created_at`,
    [name || null, image || null, bio || null, id],
  )
  return result.rows[0] || null
}

export const deleteUser = async (id: string) => {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id],
  )
  return result.rows[0] || null
}
