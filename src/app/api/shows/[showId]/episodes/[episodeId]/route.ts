import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ showId: string; episodeId: string }> }
) {
    try {
        const { userId } = await auth();
        const { showId, episodeId } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const episode = await prisma.episode.findUnique({
            where: { id: parseInt(episodeId) },
            include: {
                season: {
                    include: {
                        show: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!episode) {
            return NextResponse.json({ error: "Episode not found" }, { status: 404 });
        }

        // Verify the episode belongs to the specified show
        if (episode.season.show.id !== parseInt(showId)) {
            return NextResponse.json({ error: "Episode does not belong to the specified show" }, { status: 400 });
        }

        return NextResponse.json({
            id: episode.id,
            name: episode.name,
            episodeNumber: episode.episodeNumber,
            season: {
                id: episode.season.id,
                seasonNumber: episode.season.seasonNumber,
                show: episode.season.show,
            },
        });

    } catch (error) {
        console.error("Error fetching episode details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 