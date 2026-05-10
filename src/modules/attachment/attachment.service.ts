import path from 'path'
import fs from 'fs'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../middleware/error.middleware.js'
import LogService from '../../log/log.service.js'

const UPLOAD_DIR       = path.resolve('uploads')
const MAX_FILE_SIZE    = 50  * 1024 * 1024   // 50 МБ на файл
const MAX_TOTAL_SIZE   = 200 * 1024 * 1024   // 200 МБ суммарно на задачу
const PRIVILEGED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'MANAGER']

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

class AttachmentService {

  private static async getProjectRole(projectId: string, userId: string, role: string) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return { role: 'ADMIN' }

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

  private static async getTaskOrFail(projectId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId, isDeleted: false }
    })
    if (!task) throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)
    return task
  }

  private static async getTotalSize(taskId: string): Promise<number> {
    const result = await prisma.taskAttachment.aggregate({
      where: { taskId },
      _sum:  { fileSize: true }
    })
    return result._sum.fileSize || 0
  }

  static async upload(
    projectId: string,
    taskId: string,
    userId: string,
    role: string,
    files: Express.Multer.File[]
  ) {
    const access = await this.getProjectRole(projectId, userId, role)
    if (access.role === 'VIEWER') {
      throw new AppError('FORBIDDEN', 'Viewers cannot upload files', 403)
    }

    await this.getTaskOrFail(projectId, taskId)

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        files.forEach(f => { try { fs.unlinkSync(f.path) } catch {} })
        throw new AppError(
          'FILE_TOO_LARGE',
          `Файл "${file.originalname}" превышает лимит 50 МБ`,
          400
        )
      }
    }

    const currentTotal = await this.getTotalSize(taskId)
    const incoming     = files.reduce((sum, f) => sum + f.size, 0)

    if (currentTotal + incoming > MAX_TOTAL_SIZE) {
      files.forEach(f => { try { fs.unlinkSync(f.path) } catch {} })
      const usedMB  = Math.round(currentTotal / 1024 / 1024)
      const limitMB = Math.round(MAX_TOTAL_SIZE / 1024 / 1024)
      throw new AppError(
        'TOTAL_SIZE_EXCEEDED',
        `Суммарный объём вложений задачи превысит ${limitMB} МБ (сейчас: ${usedMB} МБ)`,
        400
      )
    }

    const created = await Promise.all(
      files.map(file => {
        const fileName = file.originalname

        return prisma.taskAttachment.create({
          data: {
            taskId,
            uploadedBy: userId,
            fileName,
            fileSize:   file.size,
            mimeType:   file.mimetype,
            url:        `/uploads/${file.filename}`,
          },
          include: {
            uploader: {
              select: {
                id: true, login: true, email: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
              }
            }
          }
        })
      })
    )

    await LogService.logAction(userId, 'UPLOAD_ATTACHMENTS', 'Task', taskId)
    return created
  }

  static async getAll(projectId: string, taskId: string, userId: string, role: string) {
    await this.getProjectRole(projectId, userId, role)
    await this.getTaskOrFail(projectId, taskId)

    return prisma.taskAttachment.findMany({
      where: { taskId },
      include: {
        uploader: {
          select: {
            id: true, login: true, email: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  static async delete(
    projectId: string,
    taskId: string,
    attachmentId: string,
    userId: string,
    role: string
  ) {
    const access       = await this.getProjectRole(projectId, userId, role)
    const task         = await this.getTaskOrFail(projectId, taskId)
    const isPrivileged = PRIVILEGED_ROLES.includes(access.role)

    const attachment = await prisma.taskAttachment.findFirst({
      where: { id: attachmentId, taskId }
    })
    if (!attachment) throw new AppError('NOT_FOUND', 'Attachment not found', 404)

    const canDelete = isPrivileged
      || attachment.uploadedBy === userId
      || task.createdBy        === userId
      || task.assignedTo       === userId

    if (!canDelete) throw new AppError('FORBIDDEN', 'Cannot delete this attachment', 403)

    try {
      const filePath = path.join(UPLOAD_DIR, path.basename(attachment.url))
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch {

    }

    await prisma.taskAttachment.delete({
      where: { id: attachmentId }
    })

    await LogService.logAction(userId, 'DELETE_ATTACHMENT', 'TaskAttachment', attachmentId)
  }
}

export default AttachmentService