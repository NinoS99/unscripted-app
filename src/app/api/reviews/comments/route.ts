import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import { trackUserActivity } from "@/lib/activityTracker";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reviewType, reviewId, content } = await request.json();

        // Validate required fields
        if (!reviewType || !reviewId || !content) {
            return NextResponse.json(
                { error: "Review type, review ID, and content are required" },
                { status: 400 }
            );
        }

        // Validate review type
        if (!["show", "season", "episode"].includes(reviewType)) {
            return NextResponse.json(
                { error: "Invalid review type" },
                { status: 400 }
            );
        }

        // Check if review exists and get related entity data
        let review;
        let entityName = '';
        switch (reviewType) {
            case "show":
                review = await prisma.showReview.findUnique({
                    where: { id: reviewId },
                    include: { show: true }
                });
                entityName = review?.show?.name || '';
                break;
            case "season":
                review = await prisma.seasonReview.findUnique({
                    where: { id: reviewId },
                    include: { season: { include: { show: true } } }
                });
                entityName = review?.season ? `${review.season.show.name} ${review.season.seasonNumber === 0 ? 'Specials' : `Season ${review.season.seasonNumber}`}` : '';
                break;
            case "episode":
                review = await prisma.episodeReview.findUnique({
                    where: { id: reviewId },
                    include: { episode: { include: { season: { include: { show: true } } } } }
                });
                entityName = review?.episode ? `${review.episode.season.show.name} ${review.episode.season.seasonNumber === 0 ? 'Specials' : `Season ${review.episode.season.seasonNumber}`}, Episode ${review.episode.episodeNumber}: ${review.episode.name}` : '';
                break;
        }

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Create the comment
        const comment = await prisma.reviewComment.create({
            data: {
                content: content.trim(),
                userId,
                ...(reviewType === "show" && { showReviewId: reviewId }),
                ...(reviewType === "season" && { seasonReviewId: reviewId }),
                ...(reviewType === "episode" && { episodeReviewId: reviewId }),
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
        // userId = review owner (who received the comment), giverId = commenter (who made the comment)
        await trackUserActivity({
            userId: review.userId, // Review owner
            activityType: 'COMMENT_CREATED',
            entityType: 'COMMENT',
            entityId: comment.id,
            description: 'Created a review comment',
            metadata: {
                contentType: reviewType as 'show' | 'season' | 'episode',
                contentName: entityName,
                reviewId: reviewId,
                commentLength: content.trim().length,
                entityType: reviewType as 'show' | 'season' | 'episode',
                entityName: entityName
            },
            giverId: userId // Commenter
        });

        // Get Clerk user data for the comment author
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(comment.user.id);
        
        return NextResponse.json({ 
            message: "Comment added successfully",
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
        console.error("Error creating review comment:", error);
        return NextResponse.json(
            { error: "Failed to add comment" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const reviewType = searchParams.get("reviewType");
        const reviewId = searchParams.get("reviewId");

        if (!reviewType || !reviewId) {
            return NextResponse.json(
                { error: "Review type and review ID are required" },
                { status: 400 }
            );
        }

        // Validate review type
        if (!["show", "season", "episode"].includes(reviewType)) {
            return NextResponse.json(
                { error: "Invalid review type" },
                { status: 400 }
            );
        }

        const comments = await prisma.reviewComment.findMany({
            where: {
                ...(reviewType === "show" && { showReviewId: parseInt(reviewId) }),
                ...(reviewType === "season" && { seasonReviewId: parseInt(reviewId) }),
                ...(reviewType === "episode" && { episodeReviewId: parseInt(reviewId) }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
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
        console.error("Error fetching review comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
} 