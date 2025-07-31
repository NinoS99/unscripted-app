import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { entityType, entityId } = await req.json();

        if (!entityType || !entityId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const unwatchedItems: Array<{
            id: number;
            name: string;
            type: "season" | "episode";
            url: string;
        }> = [];

        if (entityType === "show") {
            // Check for unwatched seasons and episodes
            const show = await prisma.show.findUnique({
                where: { id: entityId },
                include: {
                    seasons: {
                        include: {
                            episodes: true,
                        },
                    },
                },
            });

            if (show) {
                for (const season of show.seasons) {
                    // Check if season is watched
                    const seasonWatched = await prisma.watched.findFirst({
                        where: {
                            userId,
                            seasonId: season.id,
                        },
                    });

                    if (!seasonWatched) {
                        unwatchedItems.push({
                            id: season.id,
                            name: `Season ${season.seasonNumber}`,
                            type: "season",
                            url: `/show/${show.id}/season/${season.seasonNumber}`,
                        });
                    }

                    // Check for unwatched episodes in this season
                    for (const episode of season.episodes) {
                        const episodeWatched = await prisma.watched.findFirst({
                            where: {
                                userId,
                                episodeId: episode.id,
                            },
                        });

                        if (!episodeWatched) {
                            unwatchedItems.push({
                                id: episode.id,
                                name: `Episode ${episode.episodeNumber}: ${episode.name}`,
                                type: "episode",
                                url: `/show/${show.id}/season/${season.seasonNumber}/episode/${episode.episodeNumber}`,
                            });
                        }
                    }
                }
            }
        } else if (entityType === "season") {
            // Check for unwatched episodes in this season
            const season = await prisma.season.findUnique({
                where: { id: entityId },
                include: {
                    episodes: true,
                    show: true,
                },
            });

            if (season) {
                for (const episode of season.episodes) {
                    const episodeWatched = await prisma.watched.findFirst({
                        where: {
                            userId,
                            episodeId: episode.id,
                        },
                    });

                    if (!episodeWatched) {
                        unwatchedItems.push({
                            id: episode.id,
                            name: `Episode ${episode.episodeNumber}: ${episode.name}`,
                            type: "episode",
                            url: `/show/${season.show.id}/season/${season.seasonNumber}/episode/${episode.episodeNumber}`,
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            hasUnwatchedItems: unwatchedItems.length > 0,
            unwatchedItems,
        });
    } catch (error) {
        console.error("Error checking unwatched items:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 