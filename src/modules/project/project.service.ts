import { prisma } from '../../lib/prisma.js'
import type { CreateProjectInput, UpdateProjectInput } from './project.schema.js'

class ProjectService {

  static async create(userId: string, data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: userId
      }
    })
  }

  static async getAll(userId: string) {
    return prisma.project.findMany({
      where: {
        createdBy: userId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async getById(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,
        isDeleted: false
      }
    })

    if (!project) throw new Error('Project not found')

    return project
  }

  static async update(
    userId: string,
    projectId: string,
    data: UpdateProjectInput
  ) {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,
        isDeleted: false
      }
    })

    if (!existing) throw new Error('Project not found')

    return prisma.project.update({
      where: { id: projectId },
      data
    })
  }

  static async delete(userId: string, projectId: string) {
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,
        isDeleted: false
      }
    })

    if (!existing) throw new Error('Project not found')

    return prisma.project.update({
      where: { id: projectId },
      data: { isDeleted: true }
    })
  }
}

export default ProjectService