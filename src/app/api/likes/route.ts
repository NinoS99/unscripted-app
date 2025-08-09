import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { entityType, entityId } = body;

        if (!entityType || !entityId) {
            return NextResponse.json(
                { error: "Missing entityType or entityId" },
                { status: 400 }
            );
        }

        // Check if like already exists
        const existingLike = await prisma.like.findFirst({
            where: {
                userId,
                ...(entityType === "comment" && { commentId: entityId }),
                ...(entityType === "review" && { reviewId: entityId }),
                ...(entityType === "prediction" && { predictionId: entityId }),
                ...(entityType === "showReview" && { showReviewId: entityId }),
                ...(entityType === "seasonReview" && { seasonReviewId: entityId }),
                ...(entityType === "episodeReview" && { episodeReviewId: entityId }),
                ...(entityType === "watchList" && { watchListId: entityId }),
                ...(entityType === "discussion" && { discussionId: entityId }),
            },
        });

        if (existingLike) {
            // Unlike - remove the like
            await prisma.like.delete({
                where: { id: existingLike.id },
            });

            return NextResponse.json({ liked: false });
        } else {
            // Like - create new like
            await prisma.like.create({
                data: {
                    userId,
                    ...(entityType === "comment" && { commentId: entityId }),
                    ...(entityType === "review" && { reviewId: entityId }),
                    ...(entityType === "prediction" && { predictionId: entityId }),
                    ...(entityType === "showReview" && { showReviewId: entityId }),
                    ...(entityType === "seasonReview" && { seasonReviewId: entityId }),
                    ...(entityType === "episodeReview" && { episodeReviewId: entityId }),
                    ...(entityType === "watchList" && { watchListId: entityId }),
                    ...(entityType === "discussion" && { discussionId: entityId }),
                },
            });

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("Error handling like:", error);
        return NextResponse.json(
            { error: "Internal server error" },
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
        const entityType = searchParams.get("entityType");
        const entityId = searchParams.get("entityId");

        if (!entityType || !entityId) {
            return NextResponse.json(
                { error: "Missing entityType or entityId" },
                { status: 400 }
            );
        }

        // Get like count and user's like status
        const [likeCount, userLike] = await Promise.all([
            prisma.like.count({
                where: {
                    ...(entityType === "comment" && { commentId: parseInt(entityId) }),
                    ...(entityType === "review" && { reviewId: parseInt(entityId) }),
                    ...(entityType === "prediction" && { predictionId: parseInt(entityId) }),
                    ...(entityType === "showReview" && { showReviewId: parseInt(entityId) }),
                    ...(entityType === "seasonReview" && { seasonReviewId: parseInt(entityId) }),
                    ...(entityType === "episodeReview" && { episodeReviewId: parseInt(entityId) }),
                    ...(entityType === "watchList" && { watchListId: parseInt(entityId) }),
                    ...(entityType === "discussion" && { discussionId: parseInt(entityId) }),
                },
            }),
            prisma.like.findFirst({
                where: {
                    userId,
                    ...(entityType === "comment" && { commentId: parseInt(entityId) }),
                    ...(entityType === "review" && { reviewId: parseInt(entityId) }),
                    ...(entityType === "prediction" && { predictionId: parseInt(entityId) }),
                    ...(entityType === "showReview" && { showReviewId: parseInt(entityId) }),
                    ...(entityType === "seasonReview" && { seasonReviewId: parseInt(entityId) }),
                    ...(entityType === "episodeReview" && { episodeReviewId: parseInt(entityId) }),
                    ...(entityType === "watchList" && { watchListId: parseInt(entityId) }),
                    ...(entityType === "discussion" && { discussionId: parseInt(entityId) }),
                },
            }),
        ]);

        return NextResponse.json({
            likeCount,
            isLiked: !!userLike,
        });
    } catch (error) {
        console.error("Error getting like info:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 