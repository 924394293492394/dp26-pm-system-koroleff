import { prisma } from '../../lib/prisma.js'
import type { UpdateProfileInput } from './profile.schema.js'

class ProfileService {

  static async get(userId: string) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    if (!profile) throw new Error('Profile not found')

    return profile
  }

  static async update(userId: string, data: UpdateProfileInput) {
    return prisma.userProfile.update({
      where: { userId },
      data
    })
  }
}

export default ProfileService