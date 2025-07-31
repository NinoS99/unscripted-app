import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { seasonId, seasonNumber, showId } = await req.json();
        
        if (!seasonId || !seasonNumber || !showId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure IDs are numbers
        const numericSeasonId = Number(seasonId);
        const numericSeasonNumber = Number(seasonNumber);
        const numericShowId = Number(showId);

        if (isNaN(numericSeasonId) || isNaN(numericSeasonNumber) || isNaN(numericShowId)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        // Get the show with all seasons
        const show = await prisma.show.findUnique({
            where: { id: numericShowId },
            include: {
                seasons: {
                    orderBy: { seasonNumber: 'asc' }
                }
            }
        });

        if (!show) {
            return NextResponse.json({ error: "Show not found" }, { status: 404 });
        }

        // Check if this is the last season of the show
        const lastSeason = show.seasons[show.seasons.length - 1];
        const isLastSeason = lastSeason && lastSeason.seasonNumber === numericSeasonNumber;

        if (!isLastSeason) {
            return NextResponse.json({
                isLastSeason: false,
                completesShow: false
            });
        }

        // Check if all seasons in the show are watched
        const watchedSeasons = await prisma.watched.count({
            where: {
                userId,
                seasonId: {
                    in: show.seasons.map(season => season.id)
                }
            }
        });

        const completesShow = watchedSeasons === show.seasons.length;

        return NextResponse.json({
            isLastSeason: true,
            completesShow
        });

    } catch (error) {
        console.error("Error checking season completion:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 