import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../middleware/error.middleware.js'

class ChecklistService {

  private static async getAccess(projectId: string, taskId: string, userId: string, role: string) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return { role: 'ADMIN', task: null as any }

    const project = await prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
      include: { members: { where: { userId } } }
    })
    if (!project) throw new AppError('PROJECT_NOT_FOUND', 'Not found', 404)

    const memberRole = project.createdBy === userId ? 'OWNER' : project.members[0]?.role
    if (!memberRole) throw new AppError('FORBIDDEN', 'Access denied', 403)

    const task = await prisma.task.findFirst({ where: { id: taskId, projectId, isDeleted: false } })
    if (!task) throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)

    return { role: memberRole, task }
  }

  static async getAll(projectId: string, taskId: string, userId: string, role: string) {
    await this.getAccess(projectId, taskId, userId, role)
    return prisma.taskChecklist.findMany({
      where: { taskId },
      include: { creator: { select: { id: true, login: true } } },
      orderBy: { order: 'asc' }
    })
  }

  static async create(projectId: string, taskId: string, userId: string, role: string, text: string) {
    const access = await this.getAccess(projectId, taskId, userId, role)
    if (access.role === 'VIEWER') throw new AppError('FORBIDDEN', 'No access', 403)

    const last = await prisma.taskChecklist.findFirst({
      where: { taskId }, orderBy: { order: 'desc' }
    })

    return prisma.taskChecklist.create({
      data: { taskId, text, createdBy: userId, order: (last?.order ?? -1) + 1 },
      include: { creator: { select: { id: true, login: true } } }
    })
  }

  static async update(
    projectId: string, taskId: string, itemId: string,
    userId: string, role: string,
    data: { text?: string; isDone?: boolean; order?: number }
  ) {
    const access = await this.getAccess(projectId, taskId, userId, role)
    if (access.role === 'VIEWER') throw new AppError('FORBIDDEN', 'No access', 403)

    return prisma.taskChecklist.update({
      where: { id: itemId },
      data,
      include: { creator: { select: { id: true, login: true } } }
    })
  }

  static async delete(
    projectId: string, taskId: string, itemId: string,
    userId: string, role: string
  ) {
    await this.getAccess(projectId, taskId, userId, role)
    await prisma.taskChecklist.delete({ where: { id: itemId } })
  }
}

export default ChecklistService