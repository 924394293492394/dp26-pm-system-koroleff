import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../middleware/error.middleware.js'
import LogService from '../../log/log.service.js'
import type {
  AddMemberInput,
  UpdateMemberInput,
  MemberFilterInput
} from './project-member.schema.js'
import { ProjectRole } from '@prisma/client'

class ProjectMemberService {

  private static ROLE_HIERARCHY: Record<ProjectRole, number> = {
    OWNER: 4,
    MANAGER: 3,
    MEMBER: 2,
    VIEWER: 1
  }

  private static isAdmin(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
  }

  private static async getUserProjectRole(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })

    if (!member) {
      throw new AppError('FORBIDDEN', 'Not member of project', 403)
    }

    return member.role
  }

  private static canAssignRole(currentRole: ProjectRole, targetRole: ProjectRole) {
    return this.ROLE_HIERARCHY[targetRole] <= this.ROLE_HIERARCHY[currentRole]
  }

  private static canManageRole(currentRole: ProjectRole, targetRole: ProjectRole) {
    return this.ROLE_HIERARCHY[targetRole] < this.ROLE_HIERARCHY[currentRole]
  }

  private static async assertManagerAccess(projectId: string, userId: string, role: string) {
    if (this.isAdmin(role)) return;

    const projectRole = await this.getUserProjectRole(projectId, userId);

    if (!['OWNER', 'MANAGER'].includes(projectRole)) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }
  }

  private static async assertProjectAccess(projectId: string, userId: string, role: string) {
    if (this.isAdmin(role)) return;

    await this.getUserProjectRole(projectId, userId)
  }

  static async getMyMembership(projectId: string, userId: string, role: string) {
    if (this.isAdmin(role)) {
      return prisma.projectMember.findFirst({
        where: { projectId, userId }
      })
    }

    return prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })
  }

  static async add(
    projectId: string,
    currentUserId: string,
    role: string,
    data: AddMemberInput
  ) {

    await this.assertManagerAccess(projectId, currentUserId, role)

    const newRole: ProjectRole = data.role ?? ProjectRole.MEMBER

    const currentProjectRole = this.isAdmin(role)
      ? ProjectRole.OWNER
      : await this.getUserProjectRole(projectId, currentUserId)

    if (!this.canAssignRole(currentProjectRole, newRole)) {
      throw new AppError('FORBIDDEN', 'Cannot assign role higher than your own', 403)
    }

    const exists = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: data.userId }
      }
    })

    if (exists) {
      throw new AppError('CONFLICT', 'User already in project', 409)
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: newRole
      }
    })

    await LogService.logAction(currentUserId, 'ADD_PROJECT_MEMBER', 'ProjectMember', member.userId)

    return member
  }

  static async getAll(projectId: string, currentUserId: string, role: string, filters: MemberFilterInput) {
    await this.assertProjectAccess(projectId, currentUserId, role)

    const { role: filterRole, search, page, limit } = filters
    const skip = (page - 1) * limit

    const where: any = { projectId }

    if (filterRole) where.role = filterRole

    if (search) {
      where.user = {
        OR: [
          { login: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    const [data, total] = await Promise.all([
      prisma.projectMember.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              login: true,
              email: true
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.projectMember.count({ where })
    ])

    return {
      members: data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getOne(projectId: string, currentUserId: string, role: string, memberUserId: string) {
    await this.assertProjectAccess(projectId, currentUserId, role)

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            email: true
          }
        }
      }
    })

    if (!member) {
      throw new AppError('NOT_FOUND', 'Member not found', 404)
    }

    return member
  }

  static async update(projectId: string, currentUserId: string, role: string, memberUserId: string, data: UpdateMemberInput) {
    await this.assertManagerAccess(projectId, currentUserId, role)

    const currentRole = await this.getUserProjectRole(projectId, currentUserId)
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      }
    })

    if (!member) {
      throw new AppError('NOT_FOUND', 'Member not found', 404)
    }

    if (member.role === 'OWNER') {
      throw new AppError('FORBIDDEN', 'Owner cannot be modified', 403)
    }

    if (memberUserId === currentUserId) {
      throw new AppError('FORBIDDEN', 'You cannot change your own role', 403)
    }

    if (!this.canAssignRole(currentRole, data.role)) {
      throw new AppError('FORBIDDEN', 'Cannot assign role higher than your own', 403)
    }

    const updated = await prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      },
      data
    })

    await LogService.logAction(currentUserId, 'UPDATE_PROJECT_MEMBER', 'ProjectMember', memberUserId)

    return updated
  }

  static async remove(projectId: string, currentUserId: string, role: string, memberUserId: string) {
    await this.assertManagerAccess(projectId, currentUserId, role)

    if (memberUserId === currentUserId) {
      throw new AppError('FORBIDDEN', 'You cannot remove yourself', 403)
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      }
    })

    if (!member) {
      throw new AppError('NOT_FOUND', 'Member not found', 404)
    }

    if (member.role === 'OWNER') {
      throw new AppError('FORBIDDEN', 'Owner cannot be removed', 403)
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      }
    })

    await LogService.logAction(currentUserId, 'REMOVE_PROJECT_MEMBER', 'ProjectMember', memberUserId)
  }

  static async leaveProject(projectId: string, userId: string, role: string) {
    if (this.isAdmin(role)) {
      throw new AppError('FORBIDDEN', 'Admin cannot leave project', 403)
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })

    if (!member) {
      throw new AppError('NOT_FOUND', 'Not member of project', 404)
    }

    if (member.role === 'OWNER') {
      throw new AppError('FORBIDDEN', 'Owner cannot leave project', 403)
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId }
      }
    })

    await LogService.logAction(userId, 'LEAVE_PROJECT', 'ProjectMember', userId)
  }
}

export default ProjectMemberService