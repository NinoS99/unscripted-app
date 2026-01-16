import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { userId } = await auth();
        const { username } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user by username
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get user's watch lists (most recent first)
        const watchLists = await prisma.watchList.findMany({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                isPublic: true,
                friendsOnly: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10, // Limit to top 10 most recent
        });

        return NextResponse.json({ watchLists });
    } catch (error) {
        console.error("Error fetching watch lists:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 