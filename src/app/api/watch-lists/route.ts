import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            description,
            tags,
            isPublic,
            friendsOnly,
            isRanked,
            shows
        } = body;

        if (!name || !shows || shows.length === 0) {
            return NextResponse.json(
                { error: "Name and at least one show are required" },
                { status: 400 }
            );
        }

        // Create the watch list
        const watchList = await prisma.watchList.create({
            data: {
                name,
                description,
                isPublic,
                friendsOnly,
                userId,
                shows: {
                    create: shows.map((show: { 
                        showId: number; 
                        ranking?: number; 
                        note?: string; 
                        spoiler?: boolean; 
                        muchWatchSeasons?: number[] 
                    }, index: number) => ({
                        showId: show.showId,
                        ranking: show.ranking || (isRanked ? index + 1 : null),
                        note: show.note,
                        spoiler: show.spoiler || false,
                        muchWatchSeasons: show.muchWatchSeasons && show.muchWatchSeasons.length > 0 ? {
                            create: show.muchWatchSeasons.map((seasonId: number) => ({
                                seasonId
                            }))
                        } : undefined
                    }))
                },
                tags: tags && tags.length > 0 ? {
                    create: tags.map((tagName: string) => ({
                        tag: {
                            connectOrCreate: {
                                where: { name: tagName },
                                create: { name: tagName }
                            }
                        }
                    }))
                } : undefined
            },
            include: {
                shows: {
                    include: {
                        show: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });

        return NextResponse.json({
            watchListId: watchList.id,
            message: "Watch list created successfully"
        });

    } catch (error) {
        console.error("Error creating watch list:", error);
        return NextResponse.json(
            { error: "Failed to create watch list" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const isPublic = searchParams.get("public") === "true";
        const friendsOnly = searchParams.get("friends") === "true";

        // Build where clause based on privacy settings
        const whereClause: {
            isPublic?: boolean;
            friendsOnly?: boolean;
            OR?: Array<{ userId: string } | { isPublic: boolean }>;
        } = {};
        
        if (isPublic) {
            whereClause.isPublic = true;
        } else if (friendsOnly) {
            whereClause.friendsOnly = true;
        } else {
            // Get user's own watch lists and public ones
            whereClause.OR = [
                { userId },
                { isPublic: true }
            ];
        }

        const watchLists = await prisma.watchList.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true
                    }
                },
                shows: {
                    include: {
                        show: {
                            select: {
                                id: true,
                                name: true,
                                posterPath: true,
                                firstAirDate: true
                            }
                        }
                    },
                    orderBy: {
                        ranking: "asc"
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json({ watchLists });

    } catch (error) {
        console.error("Error fetching watch lists:", error);
        return NextResponse.json(
            { error: "Failed to fetch watch lists" },
            { status: 500 }
        );
    }
} 