import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { episodeId, episodeNumber, seasonId } = await req.json();
        
        if (!episodeId || !episodeNumber || !seasonId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure IDs are numbers
        const numericEpisodeId = Number(episodeId);
        const numericEpisodeNumber = Number(episodeNumber);
        const numericSeasonId = Number(seasonId);

        if (isNaN(numericEpisodeId) || isNaN(numericEpisodeNumber) || isNaN(numericSeasonId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        // Get the season with all episodes
        const season = await prisma.season.findUnique({
            where: { id: numericSeasonId },
            include: {
                episodes: {
                    orderBy: { episodeNumber: 'asc' }
                }
            }
        });

        if (!season) {
            return NextResponse.json({ error: "Season not found" }, { status: 404 });
        }

        // Check if this is the last episode of the season
        const lastEpisode = season.episodes[season.episodes.length - 1];
        const isLastEpisode = lastEpisode && lastEpisode.episodeNumber === numericEpisodeNumber;

        if (!isLastEpisode) {
            return NextResponse.json({
                isLastEpisode: false,
                completesSeason: false
            });
        }

        // Check if all episodes in the season are watched
        const watchedEpisodes = await prisma.watched.count({
            where: {
                userId,
                episodeId: {
                    in: season.episodes.map(ep => ep.id)
                }
            }
        });

        const completesSeason = watchedEpisodes === season.episodes.length;

        return NextResponse.json({
            isLastEpisode: true,
            completesSeason
        });

    } catch (error) {
        console.error("Error checking episode completion:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 