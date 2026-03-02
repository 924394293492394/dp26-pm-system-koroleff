import { prisma } from '../../lib/prisma.js'
import type { CreateGoalInput, UpdateGoalInput } from './goal.schema.js'

class GoalService {

  // --- ACCESS CHECKS ---

  private static async assertOwner(projectId: string, userId: string) {
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

  private static async assertProjectAccess(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false,
        OR: [
          { createdBy: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      }
    })

    if (!project) {
      throw new Error('Access denied or project not found')
    }
  }

  private static async validateResponsible(
    projectId: string,
    responsibleUserId?: string | null
  ) {
    if (!responsibleUserId) return

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: responsibleUserId
        }
      }
    })

    if (!member) {
      throw new Error('Responsible user must be a project member')
    }
  }

  // --- CRUD ---

  static async create(
    projectId: string,
    userId: string,
    data: CreateGoalInput
  ) {
    await this.assertOwner(projectId, userId)
    await this.validateResponsible(projectId, data.responsibleUserId)

    return prisma.goal.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        projectId,
        createdBy: userId,
        responsibleUserId: data.responsibleUserId ?? null
      }
    })
  }

  static async getAll(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId)

    return prisma.goal.findMany({
      where: {
        projectId,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getOne(
    projectId: string,
    goalId: string,
    userId: string
  ) {
    await this.assertProjectAccess(projectId, userId)

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      }
    })

    if (!goal) {
      throw new Error('Goal not found')
    }

    return goal
  }

  static async update(
    projectId: string,
    goalId: string,
    userId: string,
    data: UpdateGoalInput
  ) {
    await this.assertOwner(projectId, userId)

    const existing = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      }
    })

    if (!existing) {
      throw new Error('Goal not found')
    }

    if (data.responsibleUserId !== undefined) {
      await this.validateResponsible(projectId, data.responsibleUserId)
    }

    return prisma.goal.update({
      where: { id: goalId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    })
  }

  static async delete(
    projectId: string,
    goalId: string,
    userId: string
  ) {
    await this.assertOwner(projectId, userId)

    const existing = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      }
    })

    if (!existing) {
      throw new Error('Goal not found')
    }

    return prisma.goal.update({
      where: { id: goalId },
      data: { isDeleted: true }
    })
  }
}

export default GoalService