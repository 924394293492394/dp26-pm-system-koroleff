import { prisma } from '../../lib/prisma.js'
import type { CreateTaskInput, UpdateTaskInput } from './task.schema.js'

class TaskService {

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

  private static async validateGoal(projectId: string, goalId?: string | null) {
    if (!goalId) return

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      }
    })

    if (!goal) {
      throw new Error('Goal does not belong to this project')
    }
  }

  private static async validateAssignee(
    projectId: string,
    assignedTo?: string | null
  ) {
    if (!assignedTo) return

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assignedTo
        }
      }
    })

    if (!member) {
      throw new Error('Assigned user must be a project member')
    }
  }

  // --- CRUD ---

  static async create(
    projectId: string,
    userId: string,
    data: CreateTaskInput
  ) {
    await this.assertOwner(projectId, userId)
    await this.validateGoal(projectId, data.goalId)
    await this.validateAssignee(projectId, data.assignedTo)

    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        projectId,
        goalId: data.goalId ?? null,
        createdBy: userId,
        assignedTo: data.assignedTo ?? null
      }
    })
  }

  static async getAll(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId)

    return prisma.task.findMany({
      where: {
        projectId,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getOne(
    projectId: string,
    taskId: string,
    userId: string
  ) {
    await this.assertProjectAccess(projectId, userId)

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        isDeleted: false
      }
    })

    if (!task) {
      throw new Error('Task not found')
    }

    return task
  }

  static async update(
    projectId: string,
    taskId: string,
    userId: string,
    data: UpdateTaskInput
  ) {
    await this.assertOwner(projectId, userId)

    const existing = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        isDeleted: false
      }
    })

    if (!existing) {
      throw new Error('Task not found')
    }

    if (data.goalId !== undefined) {
      await this.validateGoal(projectId, data.goalId)
    }

    if (data.assignedTo !== undefined) {
      await this.validateAssignee(projectId, data.assignedTo)
    }

    return prisma.task.update({
      where: { id: taskId },
      data
    })
  }

  static async delete(
    projectId: string,
    taskId: string,
    userId: string
  ) {
    await this.assertOwner(projectId, userId)

    const existing = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        isDeleted: false
      }
    })

    if (!existing) {
      throw new Error('Task not found')
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { isDeleted: true }
    })
  }
}

export default TaskService