import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { episodeId, seasonId, showId } = await req.json();

        if (!episodeId || !seasonId || !showId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // First check what's actually watched
        const [seasonWatched, showWatched] = await Promise.all([
            prisma.watched.findFirst({
                where: { userId, seasonId }
            }),
            prisma.watched.findFirst({
                where: { userId, showId }
            })
        ]);

        // Unwatch the episode, and season/show only if they are watched
        const [episodeResult, seasonResult, showResult] = await Promise.all([
            // Always unwatch the episode
            prisma.watched.deleteMany({
                where: {
                    userId,
                    episodeId,
                },
            }),
            // Only unwatch the season if it's watched
            seasonWatched ? prisma.watched.deleteMany({
                where: {
                    userId,
                    seasonId,
                },
            }) : Promise.resolve({ count: 0 }),
            // Only unwatch the show if it's watched
            showWatched ? prisma.watched.deleteMany({
                where: {
                    userId,
                    showId,
                },
            }) : Promise.resolve({ count: 0 }),
        ]);

        return NextResponse.json({ 
            success: true,
            unwatched: {
                episode: episodeResult.count > 0,
                season: seasonResult.count > 0,
                show: showResult.count > 0,
            }
        });

    } catch (error) {
        console.error("Error unwatching episode cascade:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 