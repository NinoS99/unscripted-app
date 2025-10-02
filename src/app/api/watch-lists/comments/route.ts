import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import { trackUserActivity } from "@/lib/activityTracker";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const watchListId = searchParams.get("watchListId");

        if (!watchListId) {
            return NextResponse.json(
                { error: "Watch list ID is required" },
                { status: 400 }
            );
        }

        const comments = await prisma.watchListComment.findMany({
            where: {
                watchListId: parseInt(watchListId),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Get Clerk user data for all comment authors
        const commentsWithClerkImages = await Promise.all(
            comments.map(async (comment) => {
                try {
                    const clerk = await clerkClient();
                    const clerkUser = await clerk.users.getUser(comment.user.id);
                    
                    return {
                        id: comment.id,
                        content: comment.content,
                        createdAt: comment.createdAt,
                        user: {
                            id: comment.user.id,
                            username: comment.user.username,
                            profilePicture: clerkUser?.imageUrl,
                        },
                    };
                } catch (error) {
                    // If Clerk user lookup fails, log error but don't fall back
                    console.error(`Failed to fetch Clerk user for ${comment.user.id}:`, error);
                    return {
                        id: comment.id,
                        content: comment.content,
                        createdAt: comment.createdAt,
                        user: {
                            id: comment.user.id,
                            username: comment.user.username,
                            profilePicture: null,
                        },
                    };
                }
            })
        );

        return NextResponse.json({ comments: commentsWithClerkImages });
    } catch (error) {
        console.error("Error fetching watch list comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { watchListId, content } = body;

        if (!watchListId || !content || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Watch list ID and content are required" },
                { status: 400 }
            );
        }

        // Verify the watch list exists and user can access it
        const watchList = await prisma.watchList.findFirst({
            where: {
                id: parseInt(watchListId),
                OR: [
                    { isPublic: true },
                    { userId },
                    { friendsOnly: false } // This will be refined when we add friends functionality
                ]
            }
        });

        if (!watchList) {
            return NextResponse.json(
                { error: "Watch list not found or access denied" },
                { status: 404 }
            );
        }

        const comment = await prisma.watchListComment.create({
            data: {
                content: content.trim(),
                userId,
                watchListId: parseInt(watchListId),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        // Track user activity (no points awarded for comments)
        // userId = watchlist owner (who received the comment), giverId = commenter (who made the comment)
        await trackUserActivity({
            userId: watchList.userId, // Watchlist owner
            activityType: 'COMMENT_CREATED',
            entityType: 'COMMENT',
            entityId: comment.id,
            description: 'Created a watchlist comment',
            metadata: {
                contentType: 'watchlist',
                contentName: watchList.name,
                watchListId: parseInt(watchListId),
                commentLength: content.trim().length,
                entityType: 'watchlist',
                entityName: watchList.name
            },
            giverId: userId // Commenter
        });

        // Get Clerk user data for the comment author
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(comment.user.id);
        
        return NextResponse.json({ 
            comment: {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                user: {
                    id: comment.user.id,
                    username: comment.user.username,
                    profilePicture: clerkUser?.imageUrl,
                },
            }
        });
    } catch (error) {
        console.error("Error creating watch list comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
} 