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
            // Check if all episodes in the season are watched
            const season = await prisma.season.findUnique({
                where: { id: entityId },
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

            const totalEpisodes = season.episodes.length;
            const watchedEpisodes = season.episodes.filter(episode => episode.watched.length > 0).length;

            const canUnwatch = totalEpisodes === 0 || watchedEpisodes < totalEpisodes;

            return NextResponse.json({ 
                canUnwatch,
                totalEpisodes,
                watchedEpisodes,
                message: canUnwatch ? null : "Cannot unwatch season since all episodes are marked as watched"
            });

        } else if (entityType === "show") {
            // Check if all episodes in the show are watched
            const show = await prisma.show.findUnique({
                where: { id: entityId },
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

            let totalEpisodes = 0;
            let watchedEpisodes = 0;

            show.seasons.forEach(season => {
                totalEpisodes += season.episodes.length;
                watchedEpisodes += season.episodes.filter(episode => episode.watched.length > 0).length;
            });

            const canUnwatch = totalEpisodes === 0 || watchedEpisodes < totalEpisodes;

            return NextResponse.json({ 
                canUnwatch,
                totalEpisodes,
                watchedEpisodes,
                message: canUnwatch ? null : "Cannot unwatch show since all episodes are marked as watched"
            });

        } else {
            // For episodes, always allow unwatching
            return NextResponse.json({ 
                canUnwatch: true,
                message: null
            });
        }

    } catch (error) {
        console.error("Error checking if can unwatch:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 