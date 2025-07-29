import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/client";

export async function POST() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get current user data from Clerk
        const user = await currentUser();
        
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Update the user's profile picture in the database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                profilePicture: user.imageUrl || "/noAvatar.png",
            },
        });

        return NextResponse.json({
            message: "Profile picture synced successfully",
            profilePicture: updatedUser.profilePicture,
        });

    } catch (error) {
        console.error("Error syncing profile picture:", error);
        return NextResponse.json(
            { error: "Failed to sync profile picture" },
            { status: 500 }
        );
    }
} 