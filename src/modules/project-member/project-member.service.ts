import { prisma } from '../../lib/prisma.js'
import type { AddMemberInput, UpdateMemberInput } from './project-member.schema.js'

class ProjectMemberService {

  // Проверка: пользователь — создатель проекта?
  private static async assertProjectOwner(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,
        isDeleted: false
      }
    })

    if (!project) {
      throw new Error('Access denied or project not found')
    }
  }

  static async add(projectId: string, currentUserId: string, data: AddMemberInput) {
    await this.assertProjectOwner(projectId, currentUserId)

    const userExists = await prisma.userAuth.findUnique({
      where: { id: data.userId }
    })

    if (!userExists) {
      throw new Error('User not found')
    }

    return prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role ?? 'MEMBER'
      }
    })
  }

  static async getAll(projectId: string, currentUserId: string) {
    await this.assertProjectOwner(projectId, currentUserId)

    return prisma.projectMember.findMany({
      where: { projectId },
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
  }

  static async update(
    projectId: string,
    currentUserId: string,
    memberUserId: string,
    data: UpdateMemberInput
  ) {
    await this.assertProjectOwner(projectId, currentUserId)

    return prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: memberUserId
        }
      },
      data: {
        role: data.role
      }
    })
  }

  static async remove(
    projectId: string,
    currentUserId: string,
    memberUserId: string
  ) {
    await this.assertProjectOwner(projectId, currentUserId)

    return prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: memberUserId
        }
      }
    })
  }
}

export default ProjectMemberService