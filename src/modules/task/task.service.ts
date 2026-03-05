import { prisma } from '../../lib/prisma.js'
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

  private static async assertProjectAccess(
    projectId: string,
    userId: string,
    role: string
  ) {
    if (this.isAdmin(role)) return

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

  private static async assertOwner(
    projectId: string,
    userId: string,
    role: string
  ) {
    if (this.isAdmin(role)) return

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,
        isDeleted: false
      }
    })

    if (!project) {
      throw new Error('Only project owner can modify tasks')
    }
  }

  static async getSystemTasks(filters: TaskFilterInput) {

    const { page, limit, search, status, priority, assignedTo, goalId } = filters

    const where: any = { isDeleted: false }

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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.task.count({ where })

    return {
      tasks,
      meta: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    }
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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.task.count({ where })

    return {
      tasks,
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

    await this.assertOwner(projectId, userId, role)

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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.task.count({ where })

    return {
      tasks,
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
    role: string,
    data: UpdateTaskInput
  ) {

    await this.assertOwner(projectId, userId, role)

    const existing = await prisma.task.findFirst({
      where: { id: taskId, projectId, isDeleted: false }
    })

    if (!existing) {
      throw new Error('Task not found')
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

    await this.assertOwner(projectId, userId, role)

    const existing = await prisma.task.findFirst({
      where: { id: taskId, projectId, isDeleted: false }
    })

    if (!existing) {
      throw new Error('Task not found')
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { isDeleted: true }
    })

    await LogService.logAction(userId, 'DELETE_TASK', 'Task', taskId)
  }
}

export default TaskService