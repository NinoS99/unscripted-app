import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function DELETE(
    request: Request,
    { params }: { params: { reviewId: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reviewId = parseInt(params.reviewId);
        if (isNaN(reviewId)) {
            return NextResponse.json(
                { error: "Invalid review ID" },
                { status: 400 }
            );
        }

        // Check if the review exists and belongs to the user
        const review = await prisma.seasonReview.findFirst({
            where: {
                id: reviewId,
                userId: userId,
            },
        });

        if (!review) {
            return NextResponse.json(
                { error: "Review not found or you don't have permission to delete it" },
                { status: 404 }
            );
        }

        // Delete all related entries in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete likes associated with this review
            await tx.like.deleteMany({
                where: {
                    seasonReviewId: reviewId,
                },
            });

            // Delete views associated with this review
            await tx.view.deleteMany({
                where: {
                    seasonReviewId: reviewId,
                },
            });

            // Delete favourite characters associations
            await tx.seasonReviewCharacter.deleteMany({
                where: {
                    seasonReviewId: reviewId,
                },
            });

            // Delete tag associations
            await tx.seasonReviewTag.deleteMany({
                where: {
                    seasonReviewId: reviewId,
                },
            });

            // Finally, delete the review itself
            await tx.seasonReview.delete({
                where: {
                    id: reviewId,
                },
            });
        });

        return NextResponse.json({ 
            message: "Season review deleted successfully" 
        });

    } catch (error) {
        console.error("Error deleting season review:", error);
        return NextResponse.json(
            { error: "Failed to delete season review" },
            { status: 500 }
        );
    }
} 