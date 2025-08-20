import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ reviewType: string; reviewId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reviewType, reviewId } = await params;
        const reviewIdNum = parseInt(reviewId);

        if (isNaN(reviewIdNum)) {
            return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
        }

        // Verify the review exists and belongs to the user
        let review;
        switch (reviewType) {
            case "show":
                review = await prisma.showReview.findFirst({
                    where: {
                        id: reviewIdNum,
                        userId: userId
                    }
                });
                break;
            case "season":
                review = await prisma.seasonReview.findFirst({
                    where: {
                        id: reviewIdNum,
                        userId: userId
                    }
                });
                break;
            case "episode":
                review = await prisma.episodeReview.findFirst({
                    where: {
                        id: reviewIdNum,
                        userId: userId
                    }
                });
                break;
            default:
                return NextResponse.json({ error: "Invalid review type" }, { status: 400 });
        }

        if (!review) {
            return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
        }

        // Delete the review (cascade will handle related records)
        switch (reviewType) {
            case "show":
                await prisma.showReview.delete({
                    where: { id: reviewIdNum }
                });
                break;
            case "season":
                await prisma.seasonReview.delete({
                    where: { id: reviewIdNum }
                });
                break;
            case "episode":
                await prisma.episodeReview.delete({
                    where: { id: reviewIdNum }
                });
                break;
        }

        return NextResponse.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
