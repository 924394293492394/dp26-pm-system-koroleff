import { prisma } from '../../lib/prisma.js'
import type {
  AddMemberInput,
  UpdateMemberInput,
  MemberFilterInput
} from './project-member.schema.js'

class ProjectMemberService {
  private static async getUserProjectRole(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })
    if (!member) {
      throw new Error('User is not member of project')
    }
    return member.role
  }

  private static async assertManagerAccess(projectId: string, userId: string) {
    const role = await this.getUserProjectRole(projectId, userId)
    if (!['OWNER', 'MANAGER'].includes(role)) {
      throw new Error('Access denied')
    }
  }

  static async getSystemMembers(query: any) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.projectMember.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              login: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.projectMember.count()
    ])
    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getMyMembership(projectId: string, userId: string) {
    return prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })
  }

  static async add(projectId: string, currentUserId: string, data: AddMemberInput) {
    await this.assertManagerAccess(projectId, currentUserId)

    const exists = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: data.userId }
      }
    })

    if (exists) {
      throw new Error('User already in project')
    }

    return prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role ?? 'MEMBER'
      }
    })
  }

  static async getAll(
    projectId: string,
    currentUserId: string,
    filters: MemberFilterInput
  ) {
    await this.getUserProjectRole(projectId, currentUserId)

    const { role, search, page, limit } = filters
    const skip = (page - 1) * limit

    const where: any = {
      projectId
    }

    if (role) {
      where.role = role
    }

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
        orderBy: {
          joinedAt: 'desc'
        }
      }),
      prisma.projectMember.count({ where })
    ])

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getOne(
    projectId: string,
    currentUserId: string,
    memberUserId: string
  ) {
    await this.getUserProjectRole(projectId, currentUserId)

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
      throw new Error('Member not found')
    }

    return member
  }

  static async update(
    projectId: string,
    currentUserId: string,
    memberUserId: string,
    data: UpdateMemberInput
  ) {
    await this.assertManagerAccess(projectId, currentUserId)

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      }
    })

    if (!member) {
      throw new Error('Member not found')
    }

    if (member.role === 'OWNER') {
      throw new Error('Owner cannot be modified')
    }

    if (memberUserId === currentUserId) {
      throw new Error('You cannot change your own role')
    }

    return prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      },
      data
    })
  }

  static async remove(
    projectId: string,
    currentUserId: string,
    memberUserId: string
  ) {
    await this.assertManagerAccess(projectId, currentUserId)

    if (memberUserId === currentUserId) {
      throw new Error('You cannot remove yourself')
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      }
    })

    if (!member) {
      throw new Error('Member not found')
    }

    if (member.role === 'OWNER') {
      throw new Error('Owner cannot be removed')
    }

    return prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: memberUserId }
      }
    })
  }

  static async leaveProject(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })

    if (!member) {
      throw new Error('Not member of project')
    }

    if (member.role === 'OWNER') {
      throw new Error('Owner cannot leave project')
    }

    return prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId }
      }
    })
  }

}

export default ProjectMemberService