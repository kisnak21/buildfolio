export const runtime = 'nodejs'

import prisma from '@/lib/db'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const SALT_ROUNDS = 10

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      isVerified: true,
      createdAt: true,
    },
  })
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
  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters'), { statusCode: 400 })
  }
  if (name.length > 100) {
    throw Object.assign(new Error('Name must be at most 100 characters'), { statusCode: 400 })
  }
  if (email.length > 254) {
    throw Object.assign(new Error('Email must be at most 254 characters'), { statusCode: 400 })
  }
  if (bio && bio.length > 500) {
    throw Object.assign(new Error('Bio must be at most 500 characters'), { statusCode: 400 })
  }
  if (!/[A-Z]/.test(password)) {
    throw Object.assign(new Error('Password must contain at least one uppercase letter'), { statusCode: 400 })
  }
  if (!/[a-z]/.test(password)) {
    throw Object.assign(new Error('Password must contain at least one lowercase letter'), { statusCode: 400 })
  }
  if (!/[0-9]/.test(password)) {
    throw Object.assign(new Error('Password must contain at least one number'), { statusCode: 400 })
  }

  const username = name.toLowerCase().replace(/\s+/g, '')
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  const verificationToken = crypto.randomUUID()

  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      image: image ?? null,
      bio: bio ?? null,
      verificationToken,
      isVerified: false,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      isVerified: true,
      createdAt: true,
    },
  })

  await sendEmail({
    to: email,
    subject: 'Verify your Buildfolio account',
    html: `
      <h2>Welcome to Buildfolio, ${name}!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}">
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
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) return null

  if (!user.isVerified) {
    return { needsVerification: true, email: user.email }
  }

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
      is_verified: user.isVerified,
    },
  }
}

export const resendVerificationEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  if (user.isVerified) return null

  const verificationToken = crypto.randomUUID()
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken },
  })

  await sendEmail({
    to: user.email,
    subject: 'Verify your Buildfolio account',
    html: `
      <h2>Hi ${user.name}!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}">
        Verify Email
      </a>
    `,
  })

  return user
}

export const verifyEmailService = async (token: string) => {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } })
  if (!user) return null

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null },
  })

  return user
}

export const updateUser = async (
  id: string,
  { name, image, bio }: { name?: string; image?: string; bio?: string },
) => {
  if (name !== undefined && name.length > 100) {
    throw Object.assign(new Error('Name must be at most 100 characters'), { statusCode: 400 })
  }
  if (bio !== undefined && bio.length > 500) {
    throw Object.assign(new Error('Bio must be at most 500 characters'), { statusCode: 400 })
  }
  return prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(image !== undefined && { image }),
      ...(bio !== undefined && { bio }),
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      isVerified: true,
      createdAt: true,
    },
  })
}

export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
) => {
  if (newPassword.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters'), { statusCode: 400 })
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw Object.assign(new Error('Password must contain at least one uppercase letter'), { statusCode: 400 })
  }
  if (!/[a-z]/.test(newPassword)) {
    throw Object.assign(new Error('Password must contain at least one lowercase letter'), { statusCode: 400 })
  }
  if (!/[0-9]/.test(newPassword)) {
    throw Object.assign(new Error('Password must contain at least one number'), { statusCode: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return null

  const passwordMatch = await bcrypt.compare(currentPassword, user.password)
  if (!passwordMatch) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 401 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await prisma.user.update({ where: { id }, data: { password: hashedPassword } })

  return { success: true }
}

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } })
}
