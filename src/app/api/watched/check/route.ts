import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if request has a body
        const body = await req.text();
        if (!body) {
            return NextResponse.json({ error: "Request body is required" }, { status: 400 });
        }

        let parsedBody;
        try {
            parsedBody = JSON.parse(body);
        } catch {
            return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
        }

        const { entityType, entityId } = parsedBody;

        if (!entityType || !entityId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if entity is watched based on entity type
        const whereClause = {
            userId,
            ...(entityType === "show" && { showId: entityId }),
            ...(entityType === "season" && { seasonId: entityId }),
            ...(entityType === "episode" && { episodeId: entityId }),
        };

        const watched = await prisma.watched.findFirst({
            where: whereClause,
        });

        return NextResponse.json({ 
            isWatched: !!watched,
            watchedDate: watched?.createdAt || null
        });
    } catch (error) {
        console.error("Error checking watched status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 