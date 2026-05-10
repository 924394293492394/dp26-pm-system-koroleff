import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import type { RegisterInput, LoginInput } from './auth.schema.js'

class AuthService {
  static async register(data: RegisterInput) {

    const existing = await prisma.userAuth.findFirst({
      where: {
        OR: [
          { login: data.login },
          { email: data.email }
        ]
      }
    })

    if (existing) {
      throw new Error('User already exists')
    }

    const hash = await bcrypt.hash(data.password, 10)

    const result = await prisma.$transaction(async (tx) => {

      const user = await tx.userAuth.create({
        data: {
          login: data.login,
          email: data.email,
          password: hash
        }
      })

      await tx.userProfile.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName
        }
      })

      return user
    })

    return {
      id: result.id,
      login: result.login,
      email: result.email
    }
  }

  static async login(data: LoginInput) {
    const user = await prisma.userAuth.findUnique({
      where: { login: data.login }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const valid = await bcrypt.compare(data.password, user.password)

    if (!valid) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return { token }
  }

  static async getMe(userId: string) {
    const user = await prisma.userAuth.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        email: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
            avatarUrl: true,
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }
}

export default AuthService