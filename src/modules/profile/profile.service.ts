import { prisma } from '../../lib/prisma.js'
import LogService from '../../log/log.service.js'
import { AppError } from '../../middleware/error.middleware.js'
import type { UpdateProfileInput, UserQuery } from './profile.schema.js'
import fs from 'fs'
import path from 'path'

class ProfileService {

  private static isAdmin(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
  }

  // Обновить время последней активности (вызывается из middleware)
  static async updateLastActive(userId: string) {
    try {
      await prisma.userAuth.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() }
      })
    } catch {

    }
  }

  static async getMyProfile(userId: string) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true, login: true, email: true,
            role: true, createdAt: true, lastActiveAt: true
          }
        }
      }
    })

    if (!profile) throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404)

    const [projectsCount, tasksAssignedCount, tasksCompletedCount, commentsCount] = await Promise.all([
      prisma.projectMember.count({ where: { userId } }),
      prisma.task.count({ where: { assignedTo: userId, isDeleted: false } }),
      prisma.task.count({ where: { assignedTo: userId, status: 'DONE', isDeleted: false } }),
      prisma.comment.count({ where: { userId, isDeleted: false } }),
    ])

    return {
      id: profile.user.id,
      login: profile.user.login,
      email: profile.user.email,
      role: profile.user.role,
      createdAt: profile.user.createdAt,
      lastActiveAt: profile.user.lastActiveAt,
      firstName: profile.firstName,
      lastName: profile.lastName,
      position: profile.position,
      avatarUrl: profile.avatarUrl,
      stats: { projectsCount, tasksAssignedCount, tasksCompletedCount, commentsCount },
    }
  }

  static async updateMyProfile(userId: string, data: UpdateProfileInput) {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, firstName: data.firstName || '', lastName: data.lastName || '', ...data },
      update: data,
      include: {
        user: { select: { id: true, login: true, email: true, role: true } }
      }
    })
    await LogService.logAction(userId, 'UPDATE_PROFILE', 'UserProfile', profile.id)
    return profile
  }

  static async getPublicProfile(targetUserId: string, requesterRole: string) {
    const isAdmin = this.isAdmin(requesterRole)

    const profile = await prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true, login: true, email: true,
            role: true, createdAt: true, lastActiveAt: true
          }
        }
      }
    })

    if (!profile) throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404)

    const [projectsCount, tasksAssignedCount, tasksCompletedCount, commentsCount] = await Promise.all([
      prisma.projectMember.count({ where: { userId: targetUserId } }),
      prisma.task.count({ where: { assignedTo: targetUserId, isDeleted: false } }),
      prisma.task.count({ where: { assignedTo: targetUserId, status: 'DONE', isDeleted: false } }),
      prisma.comment.count({ where: { userId: targetUserId, isDeleted: false } }),
    ])

    const publicData = {
      id: profile.user.id,
      login: profile.user.login,
      role: profile.user.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      position: profile.position,
      avatarUrl: profile.avatarUrl,
      lastActiveAt: profile.user.lastActiveAt,
      stats: {
        projectsCount,
        tasksAssignedCount,
        tasksCompletedCount,
        commentsCount,
      },
    }

    // Приватные поля — только для Admin
    if (isAdmin) {
      return {
        ...publicData,
        email: profile.user.email,
        createdAt: profile.user.createdAt,
      }
    }

    return publicData
  }

  // getUsers: работает для ВСЕХ аутентифицированных пользователей ──
  // Обычные пользователи видят ограниченные данные
  // Admins видят полную информацию + фильтр по роли
  static async getUsers(requesterRole: string, query: UserQuery) {
    const isAdmin = this.isAdmin(requesterRole)
    const { page, limit, search, role } = query

    const where: any = {}

    // Фильтр по системной роли — только для Admin
    if (isAdmin && role) {
      where.role = role
    }

    // Поиск — по логину, email и имени из профиля
    if (search) {
      where.OR = [
        { login: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          profile: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ]
          }
        }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.userAuth.findMany({
        where,
        include: {
          profile: {
            select: {
              firstName: true, lastName: true,
              position: true, avatarUrl: true,
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userAuth.count({ where })
    ])

    // Формируем ответ — Admin видит всё, обычный пользователь — только публичное
    const data = users.map(u => {
      const base = {
        id: u.id,
        login: u.login,
        role: u.role,
        lastActiveAt: u.lastActiveAt,
        profile: {
          firstName: u.profile?.firstName || null,
          lastName: u.profile?.lastName || null,
          position: u.profile?.position || null,
          avatarUrl: u.profile?.avatarUrl || null,
        }
      }

      if (isAdmin) {
        return { ...base, email: u.email, createdAt: u.createdAt }
      }

      return base
    })

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }
  }

  static async searchUsers(query: { search: string; limit: number }) {
    const { search, limit } = query

    const users = await prisma.userAuth.findMany({
      where: {
        OR: [
          { login: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      },
      take: limit,
      include: {
        profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
      }
    })

    return users.map(u => ({
      id: u.id,
      login: u.login,
      email: u.email,
      profile: u.profile,
    }))
  }

  static async adminUpdateProfile(
    adminId: string,
    adminRole: string,
    targetUserId: string,
    data: UpdateProfileInput
  ) {
    if (!this.isAdmin(adminRole)) {
      throw new AppError('FORBIDDEN', 'Admin only', 403)
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        position: data.position ?? null,
        avatarUrl: data.avatarUrl ?? null,
      },
      update: data,
    })

    await LogService.logAction(adminId, 'ADMIN_UPDATE_PROFILE', 'UserProfile', profile.id)
    return profile
  }
  static async deleteAvatar(userId: string) {
    const UPLOAD_DIR = path.resolve('uploads')
    const existing = await prisma.userProfile.findUnique({ where: { userId } })

    if (existing?.avatarUrl) {
      try {
        const oldRelative = existing.avatarUrl.replace(/^\/uploads\//, '')
        const oldPath = path.join(UPLOAD_DIR, oldRelative)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      } catch {

      }
    }

    await prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl: null }
    })

    await LogService.logAction(userId, 'DELETE_AVATAR', 'UserProfile', userId)
    return { avatarUrl: null }
  }

  static async uploadAvatar(userId: string, file: Express.Multer.File) {
    const UPLOAD_DIR = path.resolve('uploads')

    // Удаляем старый аватар с диска если он существует
    const existing = await prisma.userProfile.findUnique({ where: { userId } })
    if (existing?.avatarUrl) {
      try {
        const oldRelative = existing.avatarUrl.replace(/^\/uploads\//, '')
        const oldPath = path.join(UPLOAD_DIR, oldRelative)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      } catch {

      }
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: existing?.firstName ?? '',
        lastName: existing?.lastName ?? '',
        avatarUrl,
      },
      update: { avatarUrl },
    })

    await LogService.logAction(userId, 'UPLOAD_AVATAR', 'UserProfile', profile.id)
    return { avatarUrl }
  }

}

export default ProfileService