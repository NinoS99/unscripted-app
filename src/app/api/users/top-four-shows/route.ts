import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

// GET - Fetch user's top four shows
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('userId') || userId;

        const topFourShows = await prisma.userTopFourShow.findMany({
            where: {
                userId: targetUserId
            },
            include: {
                show: {
                    select: {
                        id: true,
                        name: true,
                        posterPath: true,
                        tmdbId: true
                    }
                }
            },
            orderBy: {
                position: 'asc'
            }
        });

        return NextResponse.json({ topFourShows });
    } catch (error) {
        console.error("Error fetching top four shows:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Update user's top four shows
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { showIds } = body; // Array of show IDs in order (position 1-4)

        if (!Array.isArray(showIds) || showIds.length > 4) {
            return NextResponse.json({ error: "Invalid show IDs array. Maximum 4 shows allowed." }, { status: 400 });
        }

        // Validate that all show IDs exist
        const shows = await prisma.show.findMany({
            where: {
                id: { in: showIds }
            },
            select: { id: true }
        });

        if (shows.length !== showIds.length) {
            return NextResponse.json({ error: "One or more show IDs are invalid" }, { status: 400 });
        }

        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing top four shows for this user
            await tx.userTopFourShow.deleteMany({
                where: { userId }
            });

            // Insert new top four shows
            const topFourShows = await Promise.all(
                showIds.map((showId, index) =>
                    tx.userTopFourShow.create({
                        data: {
                            userId,
                            showId,
                            position: index + 1
                        },
                        include: {
                            show: {
                                select: {
                                    id: true,
                                    name: true,
                                    posterPath: true,
                                    tmdbId: true
                                }
                            }
                        }
                    })
                )
            );

            return topFourShows;
        });

        return NextResponse.json({ topFourShows: result });
    } catch (error) {
        console.error("Error updating top four shows:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove all top four shows for a user
export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.userTopFourShow.deleteMany({
            where: { userId }
        });

        return NextResponse.json({ message: "Top four shows cleared successfully" });
    } catch (error) {
        console.error("Error clearing top four shows:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
