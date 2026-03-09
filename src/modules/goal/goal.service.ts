import { prisma } from '../../lib/prisma.js'
import { ProjectRole, GoalStatus } from '@prisma/client'
import type { CreateGoalInput, UpdateGoalInput, GoalQuery } from './goal.schema.js'
import { AppError } from '../../middleware/error.middleware.js'
import LogService from '../../log/log.service.js'

class GoalService {

  private static ROLE_HIERARCHY: Record<ProjectRole, number> = {
    OWNER: 4,
    MANAGER: 3,
    MEMBER: 2,
    VIEWER: 1
  }

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
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    })

    if (!member) {
      throw new AppError('FORBIDDEN', 'User is not a project member', 403)
    }

    return member
  }

  private static hasRole(memberRole: ProjectRole, required: ProjectRole) {
    return this.ROLE_HIERARCHY[memberRole] >= this.ROLE_HIERARCHY[required]
  }

  private static formatGoal(goal: any) {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      dueDate: goal.dueDate,
      createdAt: goal.createdAt,

      creator: goal.creator
        ? {
            id: goal.creator.id,
            login: goal.creator.login,
            email: goal.creator.email
          }
        : null,

      responsible: goal.responsible
        ? {
            id: goal.responsible.id,
            login: goal.responsible.login,
            email: goal.responsible.email
          }
        : null,

      tasksCount: goal._count?.tasks ?? 0
    }
  }

  static async create(
    projectId: string,
    userId: string,
    role: string,
    data: CreateGoalInput
  ) {

    await this.getProject(projectId)

    if (!this.isAdmin(role)) {

      const member = await this.getMember(projectId, userId)

      if (!this.hasRole(member.role, ProjectRole.MEMBER)) {
        throw new AppError('FORBIDDEN', 'Insufficient permissions', 403)
      }
    }

    const goal = await prisma.goal.create({
      data: {
        title: data.title,
        description: data.description,
        projectId,
        createdBy: userId,
        responsibleUserId: data.responsibleUserId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    })

    await LogService.logAction(userId, 'GOAL_CREATED', 'Goal', goal.id)

    return goal
  }

  static async getAll(
    projectId: string,
    userId: string,
    role: string,
    filters: GoalQuery
  ) {

    await this.getProject(projectId)

    if (!this.isAdmin(role)) {
      await this.getMember(projectId, userId)
    }

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
        creator: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        responsible: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },

      orderBy: { createdAt: 'desc' }
    })

    return {
      data: goals.map(this.formatGoal),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async getOne(
    projectId: string,
    goalId: string,
    userId: string,
    role: string
  ) {

    await this.getProject(projectId)

    if (!this.isAdmin(role)) {
      await this.getMember(projectId, userId)
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      },

      include: {
        creator: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        responsible: {
          select: {
            id: true,
            login: true,
            email: true
          }
        },
        tasks: true
      }
    })

    if (!goal) {
      throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)
    }

    return goal
  }

  static async update(
    projectId: string,
    goalId: string,
    userId: string,
    role: string,
    data: UpdateGoalInput
  ) {

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      }
    })

    if (!goal) {
      throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)
    }

    if (!this.isAdmin(role)) {

      const member = await this.getMember(projectId, userId)

      const canEdit =
        this.hasRole(member.role, ProjectRole.MANAGER) ||
        goal.createdBy === userId

      if (!canEdit) {
        throw new AppError('FORBIDDEN', 'Insufficient permissions', 403)
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },

      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        responsibleUserId: data.responsibleUserId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    })

    await LogService.logAction(userId, 'GOAL_UPDATED', 'Goal', goalId)

    return updatedGoal
  }

  static async delete(
    projectId: string,
    goalId: string,
    userId: string,
    role: string
  ) {

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        projectId,
        isDeleted: false
      }
    })

    if (!goal) {
      throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)
    }

    if (!this.isAdmin(role)) {

      const member = await this.getMember(projectId, userId)

      const canDelete =
        this.hasRole(member.role, ProjectRole.MANAGER) ||
        goal.createdBy === userId

      if (!canDelete) {
        throw new AppError('FORBIDDEN', 'Insufficient permissions', 403)
      }
    }

    await prisma.goal.update({
      where: { id: goalId },
      data: { isDeleted: true }
    })

    await LogService.logAction(userId, 'GOAL_DELETED', 'Goal', goalId)
  }

  static async updateStatus(
    projectId: string,
    goalId: string,
    userId: string,
    role: string,
    status: GoalStatus
  ) {

    const goal = await this.update(projectId, goalId, userId, role, { status })

    await LogService.logAction(userId, 'GOAL_STATUS_UPDATED', 'Goal', goalId)

    return goal
  }

  static async updateResponsible(
    projectId: string,
    goalId: string,
    userId: string,
    role: string,
    responsibleUserId: string | null
  ) {

    const goal = await this.update(projectId, goalId, userId, role, {
      responsibleUserId
    })

    await LogService.logAction(
      userId,
      'GOAL_RESPONSIBLE_UPDATED',
      'Goal',
      goalId
    )

    return goal
  }

  static async getMyGoals(projectId: string, userId: string) {

  const goals = await prisma.goal.findMany({
    where: {
      projectId,
      responsibleUserId: userId,
      isDeleted: false
    },

    include: {
      creator: {
        select: {
          id: true,
          login: true,
          email: true
        }
      },

      responsible: {
        select: {
          id: true,
          login: true,
          email: true
        }
      },

      _count: {
        select: {
          tasks: true
        }
      }
    },

    orderBy: { createdAt: 'desc' }
  })

  return goals.map(this.formatGoal)
}
}

export default GoalService