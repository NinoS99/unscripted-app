import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ discussionId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { discussionId } = await params;
        const discussionIdNum = parseInt(discussionId);

        if (isNaN(discussionIdNum)) {
            return NextResponse.json({ error: "Invalid discussion ID" }, { status: 400 });
        }

        // Verify the discussion exists and belongs to the user
        const discussion = await prisma.discussion.findFirst({
            where: {
                id: discussionIdNum,
                userId: userId
            }
        });

        if (!discussion) {
            return NextResponse.json({ error: "Discussion not found or unauthorized" }, { status: 404 });
        }

        // Delete the discussion (cascade will handle related records)
        await prisma.discussion.delete({
            where: { id: discussionIdNum }
        });

        return NextResponse.json({ message: "Discussion deleted successfully" });
    } catch (error) {
        console.error("Error deleting discussion:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
