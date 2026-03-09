import { prisma } from '../../lib/prisma.js'
import LogService from '../../log/log.service.js'
import { AppError } from '../../middleware/error.middleware.js'
import type { UpdateProfileInput, UserQuery } from './profile.schema.js'

class ProfileService {

  private static isAdmin(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
  }

  static async getMyProfile(userId: string) {

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    })

    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404)
    }

    return {
      id: profile.user.id,
      login: profile.user.login,
      email: profile.user.email,
      role: profile.user.role,
      createdAt: profile.user.createdAt,
      firstName: profile.firstName,
      lastName: profile.lastName,
      position: profile.position,
      avatarUrl: profile.avatarUrl
    }
  }

  static async getPublicProfile(
    targetUserId: string,
    requesterRole: string
  ) {

    const profile = await prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    })

    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404)
    }

    if (this.isAdmin(requesterRole)) {
      return {
        id: profile.user.id,
        login: profile.user.login,
        email: profile.user.email,
        role: profile.user.role,
        createdAt: profile.user.createdAt,
        firstName: profile.firstName,
        lastName: profile.lastName,
        position: profile.position,
        avatarUrl: profile.avatarUrl
      }
    }

    return {
      id: profile.user.id,
      login: profile.user.login,
      firstName: profile.firstName,
      lastName: profile.lastName,
      position: profile.position,
      avatarUrl: profile.avatarUrl
    }
  }

  static async updateMyProfile(
    userId: string,
    data: UpdateProfileInput
  ) {

    const profile = await prisma.userProfile.update({
      where: { userId },
      data
    })

    await LogService.logAction(userId, 'UPDATE_PROFILE', 'UserProfile', userId)

    return profile
  }

  static async adminUpdateProfile(
    adminId: string,
    role: string,
    targetUserId: string,
    data: UpdateProfileInput
  ) {

    if (!this.isAdmin(role)) {
      throw new AppError('FORBIDDEN', 'Admin only', 403)
    }

    const profile = await prisma.userProfile.update({
      where: { userId: targetUserId },
      data
    })

    await LogService.logAction(adminId, 'ADMIN_UPDATE_PROFILE', 'UserProfile', targetUserId)

    return profile
  }

  static async getUsers(role: string, query: UserQuery) {

    if (!this.isAdmin(role)) {
      throw new AppError('FORBIDDEN', 'Admin only', 403)
    }

    const { page, limit, search } = query

    const where: any = {}

    if (search) {
      where.user = {
        OR: [
          {
            login: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }
    }

    const [users, total] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              login: true,
              email: true,
              role: true,
              createdAt: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          user: {
            createdAt: 'desc'
          }
        }
      }),
      prisma.userProfile.count({ where })
    ])

    return {
      data: users.map(p => ({
        id: p.user.id,
        login: p.user.login,
        email: p.user.email,
        role: p.user.role,
        createdAt: p.user.createdAt,
        firstName: p.firstName,
        lastName: p.lastName,
        position: p.position,
        avatarUrl: p.avatarUrl
      })),
      meta: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    }
  }
}

export default ProfileService