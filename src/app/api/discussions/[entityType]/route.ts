import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/client";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entityType = request.nextUrl.pathname.split('/').pop(); // Get entityType from URL
        const entityId = searchParams.get(`${entityType}Id`);

        if (!entityId || !entityType) {
            return NextResponse.json(
                { error: "Missing entity ID or type" },
                { status: 400 }
            );
        }

        const entityIdNum = parseInt(entityId);
        if (isNaN(entityIdNum)) {
            return NextResponse.json(
                { error: "Invalid entity ID" },
                { status: 400 }
            );
        }

        // Validate entity type
        if (!["show", "season", "episode"].includes(entityType)) {
            return NextResponse.json(
                { error: "Invalid entity type" },
                { status: 400 }
            );
        }

        // Build where clause based on entity type
        type WhereClause = { showId?: number; seasonId?: number; episodeId?: number };
        const whereClause: WhereClause = {};
        if (entityType === "show") {
            whereClause.showId = entityIdNum;
        } else if (entityType === "season") {
            whereClause.seasonId = entityIdNum;
        } else if (entityType === "episode") {
            whereClause.episodeId = entityIdNum;
        }

        // Fetch discussions with related data
        const discussions = await prisma.discussion.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
                polls: {
                    select: {
                        id: true,
                        question: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Get Clerk imageUrl for each discussion author
        const discussionsWithClerkImages = await Promise.all(
            discussions.map(async (discussion) => {
                // Get Clerk imageUrl for the discussion author
                let profilePicture = null;
                try {
                    const clerk = await clerkClient();
                    const clerkUser = await clerk.users.getUser(discussion.user.id);
                    profilePicture = clerkUser?.imageUrl;
                } catch (error) {
                    console.error(`Failed to fetch Clerk user for ${discussion.user.id}:`, error);
                }

                return {
                    ...discussion,
                    user: {
                        ...discussion.user,
                        profilePicture: profilePicture || discussion.user.profilePicture,
                    },
                };
            })
        );

        return NextResponse.json({ discussions: discussionsWithClerkImages });
    } catch (error) {
        console.error("Error fetching discussions:", error);
        return NextResponse.json(
            { error: "Failed to fetch discussions" },
            { status: 500 }
        );
    }
}
