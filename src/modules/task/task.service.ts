import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../middleware/error.middleware.js'
import LogService from '../../log/log.service.js'
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput
} from './task.schema.js'

class TaskService {

  private static isAdmin(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
  }

  private static taskInclude = {
    assignee: {
      select: {
        id: true, login: true, email: true,
        profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
      }
    },
    creator: {
      select: {
        id: true, login: true, email: true,
        profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
      }
    },
    goal: {
      select: {
        id: true, title: true, status: true,
        createdBy: true, responsibleUserId: true
      }
    },
    _count: {
      select: {
        comments: { where: { isDeleted: false } },
        attachments: true,
        checklists: true,
        links: { where: { isDeleted: false } },
      }
    }
  }

  private static async recordActivity(
    taskId: string,
    userId: string,
    action: string,
    field?: string,
    oldValue?: string,
    newValue?: string
  ) {
    try {
      await prisma.taskActivity.create({
        data: { taskId, userId, action, field, oldValue, newValue }
      })
    } catch {
      // Не блокируем основную операцию если лог не записался
    }
  }

  private static async getProjectRole(projectId: string, userId: string, role: string) {
    if (this.isAdmin(role)) return { role: 'ADMIN' }

    const project = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      include: { members: { where: { userId } } }
    })

    if (!project) throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
    if (project.createdBy === userId) return { role: 'OWNER' }

    const member = project.members[0]
    if (!member) throw new AppError('FORBIDDEN', 'Access denied', 403)

    return { role: member.role }
  }

  private static async assertProjectAccess(projectId: string, userId: string, role: string) {
    await this.getProjectRole(projectId, userId, role)
  }

  private static async isGoalPrivileged(task: any, userId: string): Promise<boolean> {
    if (!task.goalId) return false
    const goal = await prisma.goal.findFirst({
      where: { id: task.goalId, isDeleted: false }
    })
    if (!goal) return false
    return goal.createdBy === userId || goal.responsibleUserId === userId
  }

  static async getMyTasksInProject(userId: string, projectId: string, role: string, filters: TaskFilterInput) {
    await this.assertProjectAccess(projectId, userId, role)
    const { page, limit, search, status, priority } = filters

    const where: any = { projectId, assignedTo: userId, isDeleted: false }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where, include: this.taskInclude,
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }
      }),
      prisma.task.count({ where })
    ])

    return {
      data: tasks,
      meta: { total, totalPages: Math.ceil(total / limit), page, limit }
    }
  }

  static async create(projectId: string, userId: string, role: string, data: CreateTaskInput) {
    const access = await this.getProjectRole(projectId, userId, role)
    if (access.role === 'VIEWER') throw new AppError('FORBIDDEN', 'Viewer cannot create tasks', 403)

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        goalId: data.goalId,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        projectId,
        createdBy: userId,
      },
      include: this.taskInclude
    })

    await LogService.logAction(userId, 'CREATE_TASK', 'Task', task.id)

    await this.recordActivity(task.id, userId, 'CREATED')

    return task
  }

  static async getAll(projectId: string, userId: string, role: string, filters: TaskFilterInput) {
    await this.assertProjectAccess(projectId, userId, role)
    const { page, limit, search, status, priority, assignedTo, goalId } = filters

    const where: any = { projectId, isDeleted: false }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo
    if (goalId) where.goalId = goalId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where, include: this.taskInclude,
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }
      }),
      prisma.task.count({ where })
    ])

    return {
      data: tasks,
      meta: { total, totalPages: Math.ceil(total / limit), page, limit }
    }
  }

  static async getOne(projectId: string, taskId: string, userId: string, role: string) {
    await this.assertProjectAccess(projectId, userId, role)

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId, isDeleted: false },
      include: this.taskInclude
    })

    if (!task) throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)
    return task
  }

  static async update(projectId: string, taskId: string, userId: string, role: string, data: UpdateTaskInput) {
    const access = await this.getProjectRole(projectId, userId, role)

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId, isDeleted: false }
    })
    if (!task) throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)

    const isPrivileged = ['OWNER', 'MANAGER', 'ADMIN'].includes(access.role)
    const isCreator = task.createdBy === userId
    const isAssignee = task.assignedTo === userId
    const isGoalPriv = await this.isGoalPrivileged(task, userId)

    if (access.role === 'VIEWER') {
      throw new AppError('FORBIDDEN', 'Viewer cannot update tasks', 403)
    }

    if (!isPrivileged && !isCreator && !isAssignee && !isGoalPriv) {
      throw new AppError('FORBIDDEN', 'You cannot update this task', 403)
    }

    const isOnlyAssignee = isAssignee && !isPrivileged && !isCreator && !isGoalPriv

    if (isOnlyAssignee) {
      if (data.assignedTo !== undefined && data.assignedTo !== userId) {
        throw new AppError('FORBIDDEN', 'Assignee cannot reassign task', 403)
      }
    }

    const changes: Array<{ action: string; field: string; oldValue: string; newValue: string }> = []

    if (data.status && data.status !== task.status) {
      changes.push({ action: 'STATUS_CHANGED', field: 'status', oldValue: task.status, newValue: data.status })
    }
    if (data.priority && data.priority !== task.priority) {
      changes.push({ action: 'PRIORITY_CHANGED', field: 'priority', oldValue: task.priority, newValue: data.priority })
    }
    if (data.assignedTo !== undefined && data.assignedTo !== task.assignedTo) {
      changes.push({
        action: 'ASSIGNEE_CHANGED', field: 'assignedTo',
        oldValue: task.assignedTo || '', newValue: data.assignedTo || ''
      })
    }
    if (data.dueDate !== undefined) {
      const oldDate = task.dueDate ? task.dueDate.toISOString() : ''
      const newDate = data.dueDate || ''
      if (oldDate !== newDate) {
        changes.push({ action: 'DUEDATE_CHANGED', field: 'dueDate', oldValue: oldDate, newValue: newDate })
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        goalId: data.goalId,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate
          ? new Date(data.dueDate)
          : data.dueDate === null ? null : undefined,
      },
      include: this.taskInclude
    })

    await LogService.logAction(userId, 'UPDATE_TASK', 'Task', taskId)

    await Promise.all(
      changes.map(c => this.recordActivity(taskId, userId, c.action, c.field, c.oldValue, c.newValue))
    )

    return updated
  }

  static async delete(projectId: string, taskId: string, userId: string, role: string) {
    const access = await this.getProjectRole(projectId, userId, role)

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId, isDeleted: false }
    })
    if (!task) throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)

    const isPrivileged = ['OWNER', 'MANAGER', 'ADMIN'].includes(access.role)
    const isCreator = task.createdBy === userId

    if (!isPrivileged && !isCreator) {
      throw new AppError('FORBIDDEN', 'You cannot delete this task', 403)
    }

    await prisma.task.update({ where: { id: taskId }, data: { isDeleted: true } })
    await LogService.logAction(userId, 'DELETE_TASK', 'Task', taskId)
  }

  static async getAllGlobal(userId: string, role: string, filters: TaskFilterInput & { myOnly?: boolean }) {
    const { page, limit, search, status, priority, myOnly } = filters

    const projectFilter = this.isAdmin(role)
      ? { isDeleted: false }
      : { isDeleted: false, OR: [{ createdBy: userId }, { members: { some: { userId } } }] }

    const where: any = { isDeleted: false, project: projectFilter }

    if (myOnly) where.OR = [{ createdBy: userId }, { assignedTo: userId }]
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.AND = [{
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }]
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { ...this.taskInclude, project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      data: tasks,
      meta: { total, totalPages: Math.ceil(total / limit), page, limit }
    }
  }

}

export default TaskService