import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

        // No longer storing profile pictures in database - always fetch from Clerk
        return NextResponse.json({
            message: "Profile picture sync no longer needed - using Clerk directly",
            profilePicture: user.imageUrl || "/noAvatar.png",
        });

    } catch (error) {
        console.error("Error syncing profile picture:", error);
        return NextResponse.json(
            { error: "Failed to sync profile picture" },
            { status: 500 }
        );
    }
} 