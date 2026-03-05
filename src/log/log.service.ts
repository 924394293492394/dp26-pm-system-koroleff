import { prisma } from "../lib/prisma.js"

class LogService {
  static async logAction(userId: string, action: string, entity: string, entityId?: string) {
    await prisma.log.create({
      data: {
        userId,
        action,
        entity,
        entityId,
      }
    })
  }
}

export default LogService