import { prisma } from '../../lib/prisma.js'
import { ProjectRole, GoalStatus } from '@prisma/client'
import type { CreateGoalInput, UpdateGoalInput, GoalQuery } from './goal.schema.js'
import { AppError } from '../../middleware/error.middleware.js'
import LogService from '../../log/log.service.js'

class GoalService {

  private static isAdmin(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
  }

  private static async getProject(projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false
      }
    })

    if (!project) {
      throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
    }

    return project
  }

  private static async getMember(projectId: string, userId: string) {
    return prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })
  }

  static async create(projectId: string, userId: string, role: string, data: CreateGoalInput) {
    await this.getProject(projectId)

    if (!this.isAdmin(role)) {
      const member = await this.getMember(projectId, userId)

      if (!member || member.role === ProjectRole.VIEWER) {
        throw new AppError('FORBIDDEN', 'Access denied', 403)
      }
    }

    const goal = await prisma.goal.create({
      data: {
        ...data,
        projectId,
        createdBy: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    })

    await LogService.logAction(userId, 'GOAL_CREATED', 'Goal', goal.id)

    return goal
  }

  static async getAll(projectId: string, userId: string, role: string, filters: GoalQuery) {
    await this.getProject(projectId)

    const { page, limit, status, responsibleUserId, search } = filters

    const where: any = {
      projectId,
      isDeleted: false
    }

    if (status) where.status = status
    if (responsibleUserId) where.responsibleUserId = responsibleUserId

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const total = await prisma.goal.count({ where })

    const goals = await prisma.goal.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: true,
        responsible: true,
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      data: goals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async getOne(projectId: string, goalId: string, userId: string, role: string) {
    await this.getProject(projectId)

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      },
      include: {
        tasks: true,
        creator: true,
        responsible: true
      }
    })

    if (!goal) throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)

    return goal
  }

  static async update(projectId: string, goalId: string, userId: string, role: string, data: UpdateGoalInput) {
    const goal = await prisma.goal.findUnique({ where: { id: goalId } })

    if (!goal) throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)

    if (!this.isAdmin(role)) {
      const member = await this.getMember(projectId, userId)

      if (!member) {
        throw new AppError('FORBIDDEN', 'Access denied', 403)
      }

      const allowed =
        member.role === ProjectRole.OWNER ||
        member.role === ProjectRole.MANAGER ||
        goal.createdBy === userId

      if (!allowed) {
        throw new AppError('FORBIDDEN', 'Access denied', 403)
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    })

    await LogService.logAction(userId, 'GOAL_UPDATED', 'Goal', goalId)

    return updatedGoal
  }

  static async delete(projectId: string, goalId: string, userId: string, role: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    })

    if (!goal) throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)

    if (!this.isAdmin(role)) {
      const member = await this.getMember(projectId, userId)

      if (!member) throw new AppError('FORBIDDEN', 'Access denied', 403)

      const allowed =
        member.role === ProjectRole.OWNER ||
        member.role === ProjectRole.MANAGER ||
        goal.createdBy === userId

      if (!allowed) {
        throw new AppError('FORBIDDEN', 'Access denied', 403)
      }
    }

    await prisma.goal.update({
      where: { id: goalId },
      data: { isDeleted: true }
    })

    await LogService.logAction(userId, 'GOAL_DELETED', 'Goal', goalId)
  }

  static async updateStatus(projectId: string, goalId: string, userId: string, role: string, status: GoalStatus) {
    const goal = await this.update(projectId, goalId, userId, role, { status })

    await LogService.logAction(userId, 'GOAL_STATUS_UPDATED', 'Goal', goalId)

    return goal
  }

  static async updateResponsible(projectId: string, goalId: string, userId: string, role: string, responsibleUserId: string | null) {
    return this.update(projectId, goalId, userId, role, { responsibleUserId })
  }

  static async getMyGoals(projectId: string, userId: string) {
    return prisma.goal.findMany({
      where: {
        projectId,
        responsibleUserId: userId,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getSystemGoals() {
    const page = 1
    const limit = 50

    const total = await prisma.goal.count({
      where: { isDeleted: false }
    })

    const goals = await prisma.goal.findMany({
      where: { isDeleted: false },
      take: limit,
      include: {
        project: true,
        creator: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      data: goals,
      meta: {
        total,
        page,
        limit
      }
    }
  }
}

export default GoalService