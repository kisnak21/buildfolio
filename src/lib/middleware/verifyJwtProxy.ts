import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')

export interface ProxyJwtPayload {
  id: string
  email: string
  name: string
  role?: string
}

/**
 * Full cryptographic verification of the app JWT in Next.js Proxy.
 * Mirrors verifyToken() in lib/auth.ts without trusting unsigned claims.
 */
export const verifyJwtProxy = async (
  token: string,
): Promise<ProxyJwtPayload | null> => {
  if (!process.env.JWT_SECRET) return null
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role ? String(payload.role) : undefined,
    }
  } catch {
    return null
  }
}
