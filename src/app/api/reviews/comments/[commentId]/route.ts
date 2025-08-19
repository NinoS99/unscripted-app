import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ commentId: string }> }
) {
    try {
        const { userId } = await auth();
        const { commentId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Find the comment and verify ownership
        const comment = await prisma.reviewComment.findUnique({
            where: {
                id: parseInt(commentId),
            },
            include: {
                user: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        // Check if the user owns the comment
        if (comment.user.id !== userId) {
            return NextResponse.json(
                { error: "Forbidden - You can only delete your own comments" },
                { status: 403 }
            );
        }

        // Delete the comment
        await prisma.reviewComment.delete({
            where: {
                id: parseInt(commentId),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting review comment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
