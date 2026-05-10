import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    role:   string
  }
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string
      role:   string
    }

    req.user = decoded

    setImmediate(async () => {
      try {
        const user = await prisma.userAuth.findUnique({
          where:  { id: decoded.userId },
          select: { lastActiveAt: true }
        })

        const now      = new Date()
        const last     = user?.lastActiveAt
        const diffMin  = last ? (now.getTime() - last.getTime()) / 60000 : Infinity

        if (diffMin >= 5) {
          await prisma.userAuth.update({
            where: { id: decoded.userId },
            data:  { lastActiveAt: now }
          })
        }
      } catch {

      }
    })

    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}