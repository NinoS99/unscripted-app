import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/client";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    try {
        const { showId: showIdParam } = await params;
        const showId = Number(showIdParam);
        
        if (isNaN(showId)) {
            return NextResponse.json({ error: "Invalid show ID" }, { status: 400 });
        }

        const episodes = await prisma.episode.findMany({
            where: {
                season: {
                    showId: showId,
                },
            },
            select: {
                id: true,
                episodeNumber: true,
                season: {
                    select: {
                        seasonNumber: true,
                    },
                },
            },
            orderBy: [
                {
                    season: {
                        seasonNumber: 'asc',
                    },
                },
                {
                    episodeNumber: 'asc',
                },
            ],
        });

        // Transform the data to flatten the season number
        const transformedEpisodes = episodes.map(episode => ({
            id: episode.id,
            episodeNumber: episode.episodeNumber,
            seasonNumber: episode.season.seasonNumber,
        }));

        return NextResponse.json({ episodes: transformedEpisodes });
    } catch (error) {
        console.error("Error fetching episodes:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 