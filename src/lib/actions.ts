'use server'
import prisma from "./client";

export async function updateUserProfile(
  userId: string, 
  data: { bio?: string; twitter?: string; instagram?: string }
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        bio: data.bio,
        twitter: data.twitter,
        instagram: data.instagram
      },
    })
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false }
  }
}