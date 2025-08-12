import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const watchListId = searchParams.get("watchListId");

        if (!watchListId) {
            return NextResponse.json(
                { error: "Watch list ID is required" },
                { status: 400 }
            );
        }

        const comments = await prisma.watchListComment.findMany({
            where: {
                watchListId: parseInt(watchListId),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error("Error fetching watch list comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { watchListId, content } = body;

        if (!watchListId || !content || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Watch list ID and content are required" },
                { status: 400 }
            );
        }

        // Verify the watch list exists and user can access it
        const watchList = await prisma.watchList.findFirst({
            where: {
                id: parseInt(watchListId),
                OR: [
                    { isPublic: true },
                    { userId },
                    { friendsOnly: false } // This will be refined when we add friends functionality
                ]
            }
        });

        if (!watchList) {
            return NextResponse.json(
                { error: "Watch list not found or access denied" },
                { status: 404 }
            );
        }

        const comment = await prisma.watchListComment.create({
            data: {
                content: content.trim(),
                userId,
                watchListId: parseInt(watchListId),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        return NextResponse.json({ comment });
    } catch (error) {
        console.error("Error creating watch list comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
} 