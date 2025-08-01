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

        // Check if this episode will complete the season and/or show
        const season = await prisma.season.findUnique({
            where: { id: seasonId },
            include: {
                episodes: {
                    include: {
                        watched: {
                            where: { userId }
                        }
                    }
                }
            }
        });

        if (!season) {
            return NextResponse.json({ error: "Season not found" }, { status: 404 });
        }

        const totalSeasonEpisodes = season.episodes.length;
        const watchedSeasonEpisodes = season.episodes.filter(episode => episode.watched.length > 0).length;
        
        // Check if this episode is the last remaining unwatched episode in the season
        const willCompleteSeason = (watchedSeasonEpisodes + 1) === totalSeasonEpisodes;

        // Check if this episode completes the show
        const show = await prisma.show.findUnique({
            where: { id: showId },
            include: {
                seasons: {
                    include: {
                        episodes: {
                            include: {
                                watched: {
                                    where: { userId }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!show) {
            return NextResponse.json({ error: "Show not found" }, { status: 404 });
        }

        let totalShowEpisodes = 0;
        let watchedShowEpisodes = 0;

        show.seasons.forEach(season => {
            totalShowEpisodes += season.episodes.length;
            watchedShowEpisodes += season.episodes.filter(episode => episode.watched.length > 0).length;
        });

        // Check if this episode is the last remaining unwatched episode in the show
        const willCompleteShow = (watchedShowEpisodes + 1) === totalShowEpisodes;

        // Mark the episode as watched
        const episodeWatched = await prisma.watched.upsert({
            where: {
                userId_episodeId: { userId, episodeId },
            },
            update: {},
            create: {
                userId,
                episodeId,
            },
        });

        let seasonWatched = null;
        let showWatched = null;

        // If this completes the season, mark the season as watched
        if (willCompleteSeason) {
            seasonWatched = await prisma.watched.upsert({
                where: {
                    userId_seasonId: { userId, seasonId },
                },
                update: {},
                create: {
                    userId,
                    seasonId,
                },
            });
        }

        // If this completes the show, mark the show as watched
        if (willCompleteShow) {
            showWatched = await prisma.watched.upsert({
                where: {
                    userId_showId: { userId, showId },
                },
                update: {},
                create: {
                    userId,
                    showId,
                },
            });
        }

        return NextResponse.json({
            success: true,
            episodeWatched,
            seasonWatched: willCompleteSeason ? seasonWatched : null,
            showWatched: willCompleteShow ? showWatched : null,
            autoCompleted: {
                season: willCompleteSeason,
                show: willCompleteShow,
            }
        });

    } catch (error) {
        console.error("Error marking episode as watched:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 