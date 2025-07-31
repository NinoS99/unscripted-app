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

        if (entityType === "season") {
            // For seasons, mark the season and all its episodes as watched
            const season = await prisma.season.findUnique({
                where: { id: entityId },
                include: {
                    episodes: true,
                },
            });

            if (!season) {
                return NextResponse.json({ error: "Season not found" }, { status: 404 });
            }

            // Mark the season as watched
            const seasonWatched = await prisma.watched.upsert({
                where: {
                    userId_seasonId: { userId, seasonId: entityId },
                },
                update: {},
                create: {
                    userId,
                    seasonId: entityId,
                },
            });

            // Mark all episodes in the season as watched
            const episodeWatchedPromises = season.episodes.map((episode) =>
                prisma.watched.upsert({
                    where: {
                        userId_episodeId: { userId, episodeId: episode.id },
                    },
                    update: {},
                    create: {
                        userId,
                        episodeId: episode.id,
                    },
                })
            );

            const episodeWatched = await Promise.all(episodeWatchedPromises);

            return NextResponse.json({ 
                success: true, 
                seasonWatched,
                episodeWatched: episodeWatched.length 
            });
        } else if (entityType === "show") {
            // For shows, mark the show, all seasons, and all episodes as watched
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

            if (!show) {
                return NextResponse.json({ error: "Show not found" }, { status: 404 });
            }

            // Mark the show as watched
            const showWatched = await prisma.watched.upsert({
                where: {
                    userId_showId: { userId, showId: entityId },
                },
                update: {},
                create: {
                    userId,
                    showId: entityId,
                },
            });

            // Mark all seasons as watched
            const seasonWatchedPromises = show.seasons.map((season) =>
                prisma.watched.upsert({
                    where: {
                        userId_seasonId: { userId, seasonId: season.id },
                    },
                    update: {},
                    create: {
                        userId,
                        seasonId: season.id,
                    },
                })
            );

            // Mark all episodes as watched
            const episodeWatchedPromises = show.seasons.flatMap((season) =>
                season.episodes.map((episode) =>
                    prisma.watched.upsert({
                        where: {
                            userId_episodeId: { userId, episodeId: episode.id },
                        },
                        update: {},
                        create: {
                            userId,
                            episodeId: episode.id,
                        },
                    })
                )
            );

            const [seasonWatched, episodeWatched] = await Promise.all([
                Promise.all(seasonWatchedPromises),
                Promise.all(episodeWatchedPromises),
            ]);

            return NextResponse.json({ 
                success: true, 
                showWatched,
                seasonWatched: seasonWatched.length,
                episodeWatched: episodeWatched.length 
            });
        } else {
            // For episodes, use the original logic
            const watchedData = {
                userId,
                episodeId: entityId,
            };

            // Use upsert to handle both create and update
            const watched = await prisma.watched.upsert({
                where: {
                    userId_episodeId: { userId, episodeId: entityId },
                },
                update: {},
                create: watchedData,
            });

            return NextResponse.json({ success: true, watched });
        }
    } catch (error) {
        console.error("Error marking as watched:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { entityType, entityId } = await req.json();

        if (!entityType || !entityId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Delete only the specific entity's watched record (not bulk operations)
        const whereClause = {
            userId,
            ...(entityType === "show" && { showId: entityId }),
            ...(entityType === "season" && { seasonId: entityId }),
            ...(entityType === "episode" && { episodeId: entityId }),
        };

        await prisma.watched.deleteMany({
            where: whereClause,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing watched status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 