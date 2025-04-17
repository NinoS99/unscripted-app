"use server";
import prisma from "./client";

type ProfileData = {
    bio?: string | null;
    twitter?: string | null;
    instagram?: string | null;
};

export async function updateUserProfile(userId: string, data: ProfileData) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                bio: data.bio,
                twitter: data.twitter,
                instagram: data.instagram,
            },
        });
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}
