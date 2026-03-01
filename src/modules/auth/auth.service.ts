import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import type { RegisterInput, LoginInput } from './auth.schema.js'

export class AuthService {

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

    const user = await prisma.userAuth.create({
      data: {
        login: data.login,
        email: data.email,
        password: hash
      }
    })

    return {
      id: user.id,
      login: user.login,
      email: user.email
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
}