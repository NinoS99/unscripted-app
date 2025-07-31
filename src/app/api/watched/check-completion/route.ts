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
        
        // Ensure entityId is a number
        const numericEntityId = Number(entityId);
        if (isNaN(numericEntityId)) {
            return NextResponse.json({ error: "Invalid entity ID" }, { status: 400 });
        }

        if (!entityType || !entityId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const completionData = {
            isCompleted: false,
            autoMarked: false,
            completionDate: null as Date | null,
        };

        if (entityType === "season") {
            // Check if all episodes in the season are watched
            const season = await prisma.season.findUnique({
                where: { id: numericEntityId },
                include: {
                    episodes: true,
                },
            });

            if (season && season.episodes.length > 0) {
                const watchedEpisodes = await prisma.watched.count({
                    where: {
                        userId,
                        episodeId: {
                            in: season.episodes.map(ep => ep.id),
                        },
                    },
                });

                const isCompleted = watchedEpisodes === season.episodes.length;

                if (isCompleted) {
                    // Check if season is already marked as watched
                    const seasonWatched = await prisma.watched.findFirst({
                        where: {
                            userId,
                            seasonId: numericEntityId,
                        },
                    });

                    if (!seasonWatched) {
                        // Auto-mark season as watched
                        await prisma.watched.create({
                            data: {
                                userId,
                                seasonId: numericEntityId,
                            },
                        });
                        completionData.autoMarked = true;
                    }

                    completionData.isCompleted = true;
                    completionData.completionDate = seasonWatched?.createdAt || new Date();
                }
            }
        } else if (entityType === "show") {
            // Check if all seasons in the show are watched
            const show = await prisma.show.findUnique({
                where: { id: numericEntityId },
                include: {
                    seasons: {
                        include: {
                            episodes: true,
                        },
                    },
                },
            });

            if (show && show.seasons.length > 0) {
                const watchedSeasons = await prisma.watched.count({
                    where: {
                        userId,
                        seasonId: {
                            in: show.seasons.map(season => season.id),
                        },
                    },
                });

                const isCompleted = watchedSeasons === show.seasons.length;

                if (isCompleted) {
                    // Check if show is already marked as watched
                    const showWatched = await prisma.watched.findFirst({
                        where: {
                            userId,
                            showId: numericEntityId,
                        },
                    });

                    if (!showWatched) {
                        // Auto-mark show as watched
                        await prisma.watched.create({
                            data: {
                                userId,
                                showId: numericEntityId,
                            },
                        });
                        completionData.autoMarked = true;
                    }

                    completionData.isCompleted = true;
                    completionData.completionDate = showWatched?.createdAt || new Date();
                }
            }
        }

        return NextResponse.json(completionData);
    } catch (error) {
        console.error("Error checking completion:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 