import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { seasonId, showId } = await req.json();

        if (!seasonId || !showId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get the season with all episodes
        const season = await prisma.season.findUnique({
            where: { id: seasonId },
            include: {
                episodes: true,
            },
        });

        if (!season) {
            return NextResponse.json({ error: "Season not found" }, { status: 404 });
        }

        // Check if this season will complete the show
        const show = await prisma.show.findUnique({
            where: { id: parseInt(showId.toString()) },
            include: {
                seasons: {
                    include: {
                        watched: {
                            where: { userId }
                        }
                    }
                }
            }
        });

        if (!show) {
            return NextResponse.json({ error: "Show not found" }, { status: 404 });
        }

        const totalSeasons = show.seasons.length;
        const watchedSeasons = show.seasons.filter(season => season.watched.length > 0).length;
        
        // Check if this season is the last remaining unwatched season in the show
        const willCompleteShow = (watchedSeasons + 1) === totalSeasons;

        // Mark the season as watched
        const seasonWatched = await prisma.watched.upsert({
            where: {
                userId_seasonId: { userId, seasonId },
            },
            update: {},
            create: {
                userId,
                seasonId,
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

        let showWatched = null;

        // If this completes the show, mark the show as watched
        if (willCompleteShow) {
            showWatched = await prisma.watched.upsert({
                where: {
                    userId_showId: { userId, showId: parseInt(showId.toString()) },
                },
                update: {},
                create: {
                    userId,
                    showId: parseInt(showId.toString()),
                },
            });
        }

        return NextResponse.json({
            success: true,
            seasonWatched,
            episodeWatched: episodeWatched.length,
            showWatched: willCompleteShow ? showWatched : null,
            autoCompleted: {
                show: willCompleteShow,
            }
        });

    } catch (error) {
        console.error("Error marking season as watched:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 