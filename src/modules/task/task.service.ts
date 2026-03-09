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

  private static async getProjectRole(
    projectId: string,
    userId: string,
    role: string
  ) {

    if (this.isAdmin(role)) {
      return { role: 'ADMIN' }
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false
      },
      include: {
        members: {
          where: { userId }
        }
      }
    })

    if (!project) {
      throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.createdBy === userId) {
      return { role: 'OWNER' }
    }

    const member = project.members[0]

    if (!member) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    return { role: member.role }
  }

  private static async assertProjectAccess(
    projectId: string,
    userId: string,
    role: string
  ) {
    await this.getProjectRole(projectId, userId, role)
  }

  static async getMyTasksInProject(
    userId: string,
    projectId: string,
    role: string,
    filters: TaskFilterInput
  ) {

    await this.assertProjectAccess(projectId, userId, role)

    const { page, limit, search, status, priority } = filters

    const where: any = {
      projectId,
      assignedTo: userId,
      isDeleted: false
    }

    if (status) where.status = status
    if (priority) where.priority = priority

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            login: true,
            email: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.task.count({ where })

    return {
      data: tasks,
      meta: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    }
  }

  static async create(
    projectId: string,
    userId: string,
    role: string,
    data: CreateTaskInput
  ) {

    const access = await this.getProjectRole(projectId, userId, role)

    if (access.role === 'VIEWER') {
      throw new AppError('FORBIDDEN', 'Viewer cannot create tasks', 403);
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        projectId,
        createdBy: userId
      }
    })

    await LogService.logAction(userId, 'CREATE_TASK', 'Task', task.id)

    return task
  }

  static async getAll(
    projectId: string,
    userId: string,
    role: string,
    filters: TaskFilterInput
  ) {

    await this.assertProjectAccess(projectId, userId, role)

    const { page, limit, search, status, priority, assignedTo, goalId } = filters

    const where: any = {
      projectId,
      isDeleted: false
    }

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

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            login: true,
            email: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.task.count({ where })

    return {
      data: tasks,
      meta: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    }
  }

  static async getOne(
    projectId: string,
    taskId: string,
    userId: string,
    role: string
  ) {

    await this.assertProjectAccess(projectId, userId, role)

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        isDeleted: false
      },
      include: {
        assignee: {
          select: {
            id: true,
            login: true,
            email: true
          }
        }
      }
    })

    if (!task) {
      throw new AppError('TASK_NOT_FOUND', 'Task not found', 404);
    }

    return task
  }

  static async update(
    projectId: string,
    taskId: string,
    userId: string,
    role: string,
    data: UpdateTaskInput
  ) {

    const access = await this.getProjectRole(projectId, userId, role)

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        isDeleted: false
      }
    })

    if (!task) {
      throw new AppError('TASK_NOT_FOUND', 'Task not found', 404);
    }

    if (['OWNER', 'MANAGER', 'ADMIN'].includes(access.role)) {

    } else if (access.role === 'MEMBER') {

      if (task.createdBy !== userId && task.assignedTo !== userId) {
        throw new AppError('FORBIDDEN', 'You cannot update this task', 403);
      }

    } else {
      throw new AppError('FORBIDDEN', 'Viewer cannot update tasks', 403);
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data
    })

    await LogService.logAction(userId, 'UPDATE_TASK', 'Task', taskId)

    return updated
  }

  static async delete(
    projectId: string,
    taskId: string,
    userId: string,
    role: string
  ) {

    const access = await this.getProjectRole(projectId, userId, role)

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        isDeleted: false
      }
    })

    if (!task) {
      throw new AppError('TASK_NOT_FOUND', 'Task not found', 404);
    }

    if (['OWNER', 'MANAGER', 'ADMIN'].includes(access.role)) {

    } else if (access.role === 'MEMBER') {

      if (task.createdBy !== userId) {
        throw new AppError('FORBIDDEN', 'You cannot delete this task', 403);
      }

    } else {
      throw new AppError('FORBIDDEN', 'Viewer cannot delete tasks', 403);
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { isDeleted: true }
    })

    await LogService.logAction(userId, 'DELETE_TASK', 'Task', taskId)
  }
}

export default TaskService