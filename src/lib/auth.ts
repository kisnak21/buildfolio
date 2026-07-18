import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export const signToken = (payload: {
  id: string
  email: string
  name: string
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as {
    id: string
    email: string
    name: string
  }
}
