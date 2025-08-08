import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ watchListId: string }> }
) {
    try {
        const { userId } = await auth();
        const { watchListId } = await params;
        const body = await request.json();
        const { showId } = body;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!showId) {
            return NextResponse.json({ error: "Show ID is required" }, { status: 400 });
        }

        const watchListIdNum = parseInt(watchListId);
        if (isNaN(watchListIdNum)) {
            return NextResponse.json({ error: "Invalid watch list ID" }, { status: 400 });
        }

        // Check if watch list exists and belongs to user
        const watchList = await prisma.watchList.findFirst({
            where: {
                id: watchListIdNum,
                userId: userId,
            },
            include: {
                shows: {
                    orderBy: {
                        ranking: "asc",
                    },
                },
            },
        });

        if (!watchList) {
            return NextResponse.json({ error: "Watch list not found" }, { status: 404 });
        }

        // Check if show already exists in watch list
        const existingShow = await prisma.watchListShow.findFirst({
            where: {
                watchListId: watchListIdNum,
                showId: showId,
            },
        });

        if (existingShow) {
            return NextResponse.json({ error: "Show already in watch list" }, { status: 400 });
        }

        // Get the next ranking (add to end)
        const nextRanking = watchList.shows.length > 0 
            ? Math.max(...watchList.shows.map(s => s.ranking || 0)) + 1 
            : 1;

        // Add show to watch list
        const watchListShow = await prisma.watchListShow.create({
            data: {
                watchListId: watchListIdNum,
                showId: showId,
                ranking: watchList.shows.some(s => s.ranking !== null) ? nextRanking : null,
            },
        });

        return NextResponse.json({ 
            message: "Show added to watch list",
            watchListShow 
        });
    } catch (error) {
        console.error("Error adding show to watch list:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 