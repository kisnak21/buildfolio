import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')

export interface EdgeJwtPayload {
  id: string
  email: string
  name: string
}

/**
 * Full cryptographic verification of the app JWT for use on the Edge
 * runtime (middleware). Mirrors verifyToken() in lib/auth.ts.
 */
export const verifyJwtEdge = async (
  token: string,
): Promise<EdgeJwtPayload | null> => {
  if (!process.env.JWT_SECRET) return null
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
    }
  } catch {
    return null
  }
}
