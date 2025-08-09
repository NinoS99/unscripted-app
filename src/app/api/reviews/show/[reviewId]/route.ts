import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reviewId: reviewIdParam } = await params;
        const reviewId = parseInt(reviewIdParam);
        if (isNaN(reviewId)) {
            return NextResponse.json(
                { error: "Invalid review ID" },
                { status: 400 }
            );
        }

        // Check if the review exists and belongs to the user
        const review = await prisma.showReview.findFirst({
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
                    showReviewId: reviewId,
                },
            });



            // Delete favourite characters associations
            await tx.showReviewCharacter.deleteMany({
                where: {
                    showReviewId: reviewId,
                },
            });

            // Delete tag associations
            await tx.showReviewTag.deleteMany({
                where: {
                    showReviewId: reviewId,
                },
            });

            // Finally, delete the review itself
            await tx.showReview.delete({
                where: {
                    id: reviewId,
                },
            });
        });

        return NextResponse.json({ 
            message: "Review deleted successfully" 
        });

    } catch (error) {
        console.error("Error deleting show review:", error);
        return NextResponse.json(
            { error: "Failed to delete review" },
            { status: 500 }
        );
    }
} 