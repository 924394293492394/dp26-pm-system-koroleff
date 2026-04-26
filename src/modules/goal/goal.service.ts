import { prisma } from '../../lib/prisma.js'
import { ProjectRole, GoalStatus } from '@prisma/client'
import type { CreateGoalInput, UpdateGoalInput, GoalQuery } from './goal.schema.js'
import { AppError } from '../../middleware/error.middleware.js'
import LogService from '../../log/log.service.js'

class GoalService {

  private static ROLE_HIERARCHY: Record<ProjectRole, number> = {
    OWNER: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1
  }

  private static isAdmin(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
  }

  private static async getProject(projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false }
    })
    if (!project) throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
    return project
  }

  private static async getMember(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    })
    if (!member) throw new AppError('FORBIDDEN', 'User is not a project member', 403)
    return member
  }

  private static hasRole(memberRole: ProjectRole, required: ProjectRole) {
    return this.ROLE_HIERARCHY[memberRole] >= this.ROLE_HIERARCHY[required]
  }

  private static formatGoal(goal: any, userId?: string) {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      dueDate: goal.dueDate,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      isPinned: userId ? (goal.pins?.some((p: any) => p.userId === userId) ?? false) : false,
      creator: goal.creator
        ? { id: goal.creator.id, login: goal.creator.login, email: goal.creator.email }
        : null,
      responsible: goal.responsible
        ? { id: goal.responsible.id, login: goal.responsible.login, email: goal.responsible.email }
        : null,
      tasksCount: goal._count?.tasks ?? 0
    }
  }

  private static goalInclude(userId: string) {
    return {
      creator: { select: { id: true, login: true, email: true } },
      responsible: { select: { id: true, login: true, email: true } },
      _count: { select: { tasks: true } },
      pins: { where: { userId }, select: { userId: true } }
    }
  }

  static async create(projectId: string, userId: string, role: string, data: CreateGoalInput) {
    await this.getProject(projectId)

    if (!this.isAdmin(role)) {
      const member = await this.getMember(projectId, userId)
      if (!this.hasRole(member.role, ProjectRole.MEMBER)) {
        throw new AppError('FORBIDDEN', 'Insufficient permissions', 403)
      }
    }

    const created = await prisma.goal.create({
      data: {
        title: data.title,
        description: data.description,
        projectId,
        createdBy: userId,
        responsibleUserId: data.responsibleUserId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    })

    await LogService.logAction(userId, 'GOAL_CREATED', 'Goal', created.id)

    const full = await prisma.goal.findFirst({
      where: { id: created.id },
      include: this.goalInclude(userId)
    })

    return this.formatGoal(full!, userId)
  }

  static async getAll(projectId: string, userId: string, role: string, filters: GoalQuery) {
    await this.getProject(projectId)
    if (!this.isAdmin(role)) await this.getMember(projectId, userId)

    const { page, limit, status, responsibleUserId, search } = filters

    const where: any = { projectId, isDeleted: false }
    if (status) where.status = status
    if (responsibleUserId) where.responsibleUserId = responsibleUserId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [total, goals] = await Promise.all([
      prisma.goal.count({ where }),
      prisma.goal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: this.goalInclude(userId),
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      data: goals.map(g => this.formatGoal(g, userId)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }
  }

  static async getOne(projectId: string, goalId: string, userId: string, role: string) {
    await this.getProject(projectId)
    if (!this.isAdmin(role)) await this.getMember(projectId, userId)

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, projectId, isDeleted: false },
      include: {
        ...this.goalInclude(userId),
        tasks: {
          where: { isDeleted: false },
          select: { id: true, title: true, status: true, priority: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!goal) throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)
    return { ...this.formatGoal(goal, userId), tasks: goal.tasks }
  }

  static async update(
    projectId: string,
    goalId: string,
    userId: string,
    role: string,
    data: UpdateGoalInput
  ) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, projectId, isDeleted: false }
    })
    if (!goal) throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)

    if (!this.isAdmin(role)) {
      const member = await this.getMember(projectId, userId)

      if (member.role === ProjectRole.VIEWER) {
        throw new AppError('FORBIDDEN', 'Viewers cannot edit goals', 403)
      }

      const isOwnerOrManager = this.hasRole(member.role, ProjectRole.MANAGER)
      const isCreator = goal.createdBy === userId
      const isResponsible = goal.responsibleUserId === userId

      const canEdit = isOwnerOrManager || isCreator || isResponsible
      if (!canEdit) {
        throw new AppError('FORBIDDEN', 'Insufficient permissions to edit goal', 403)
      }

      const onlyResponsible = isResponsible && !isOwnerOrManager && !isCreator
      if (onlyResponsible && data.responsibleUserId !== undefined) {
        throw new AppError(
          'FORBIDDEN',
          'Responsible user cannot reassign responsibility',
          403
        )
      }
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        responsibleUserId: data.responsibleUserId,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined
      }
    })

    await LogService.logAction(userId, 'GOAL_UPDATED', 'Goal', goalId)
    return updated
  }

  static async delete(
    projectId: string,
    goalId: string,
    userId: string,
    role: string
  ) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, projectId, isDeleted: false }
    })
    if (!goal) throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)

    if (!this.isAdmin(role)) {
      const member = await this.getMember(projectId, userId)
      const isOwnerOrManager = this.hasRole(member.role, ProjectRole.MANAGER)
      const isCreator = goal.createdBy === userId

      if (!isOwnerOrManager && !isCreator) {
        throw new AppError('FORBIDDEN', 'Only owner, manager or creator can delete goal', 403)
      }
    }

    await prisma.goal.update({ where: { id: goalId }, data: { isDeleted: true } })
    await LogService.logAction(userId, 'GOAL_DELETED', 'Goal', goalId)
  }

  static async updateStatus(projectId: string, goalId: string, userId: string, role: string, status: GoalStatus) {
    return this.update(projectId, goalId, userId, role, { status })
  }

  static async updateResponsible(projectId: string, goalId: string, userId: string, role: string, responsibleUserId: string | null) {
    return this.update(projectId, goalId, userId, role, { responsibleUserId })
  }

  static async getMyGoals(projectId: string, userId: string) {
    await this.getProject(projectId)

    const goals = await prisma.goal.findMany({
      where: {
        projectId,
        isDeleted: false,
        OR: [
          { responsibleUserId: userId },
          { createdBy: userId },
          { pins: { some: { userId } } }
        ]
      },
      include: this.goalInclude(userId),
      orderBy: { createdAt: 'desc' }
    })

    return goals.map(g => this.formatGoal(g, userId))
  }

  static async getAllGlobal(userId: string, role: string, filters: GoalQuery & { myOnly?: boolean }) {
    const { page, limit, status, search, myOnly } = filters

    const projectFilter = this.isAdmin(role)
      ? { isDeleted: false }
      : {
        isDeleted: false,
        OR: [
          { createdBy: userId },
          { members: { some: { userId } } }
        ]
      }

    const where: any = {
      isDeleted: false,
      project: projectFilter
    }

    if (myOnly) {
      where.OR = [
        { createdBy: userId },
        { responsibleUserId: userId },
        { pins: { some: { userId } } }
      ]
    }

    if (status) where.status = status
    if (search) {
      where.AND = [{
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }]
    }

    const [total, goals] = await Promise.all([
      prisma.goal.count({ where }),
      prisma.goal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ...this.goalInclude(userId),
          project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      data: goals.map(g => ({
        ...this.formatGoal(g, userId),
        project: g.project
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }
  }

  static async pinGoal(projectId: string, goalId: string, userId: string, role: string) {
    await this.getProject(projectId)
    if (!this.isAdmin(role)) await this.getMember(projectId, userId)

    const goal = await prisma.goal.findFirst({ where: { id: goalId, projectId, isDeleted: false } })
    if (!goal) throw new AppError('GOAL_NOT_FOUND', 'Goal not found', 404)

    await prisma.goalPin.upsert({
      where: { userId_goalId: { userId, goalId } },
      create: { userId, goalId },
      update: {}
    })

    return { pinned: true }
  }

  static async unpinGoal(projectId: string, goalId: string, userId: string, role: string) {
    await this.getProject(projectId)
    if (!this.isAdmin(role)) await this.getMember(projectId, userId)

    await prisma.goalPin.deleteMany({ where: { userId, goalId } })
    return { pinned: false }
  }
}

export default GoalService