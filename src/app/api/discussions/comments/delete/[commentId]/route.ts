import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ commentId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { commentId: commentIdParam } = await params;
        const commentId = parseInt(commentIdParam);
        if (isNaN(commentId)) {
            return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
        }

        // Get the comment to check ownership
        const comment = await prisma.discussionComment.findUnique({
            where: { id: commentId },
            select: {
                id: true,
                userId: true,
                content: true,
                discussionId: true,
            },
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // Check if the user owns the comment
        if (comment.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Soft delete the comment by setting isDeleted flag
        await prisma.discussionComment.update({
            where: { id: commentId },
            data: {
                isDeleted: true,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
