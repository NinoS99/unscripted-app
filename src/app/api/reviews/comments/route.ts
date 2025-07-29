import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

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

        // Check if review exists
        let review;
        switch (reviewType) {
            case "show":
                review = await prisma.showReview.findUnique({
                    where: { id: reviewId },
                });
                break;
            case "season":
                review = await prisma.seasonReview.findUnique({
                    where: { id: reviewId },
                });
                break;
            case "episode":
                review = await prisma.episodeReview.findUnique({
                    where: { id: reviewId },
                });
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
        });

        return NextResponse.json({ 
            message: "Comment added successfully",
            comment: {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
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
                        profilePicture: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ comments });

    } catch (error) {
        console.error("Error fetching review comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
} 