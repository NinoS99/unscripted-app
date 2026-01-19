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
    const { commentId, reactionTypeId } = body;

    if (!commentId || !reactionTypeId) {
      return NextResponse.json(
        { error: "Missing required fields: commentId and reactionTypeId" },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await prisma.predictionComment.findUnique({
      where: { id: parseInt(commentId) },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if reaction type exists
    const reactionType = await prisma.reactionType.findUnique({
      where: { id: parseInt(reactionTypeId) },
      select: { id: true },
    });

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type not found" }, { status: 404 });
    }

    // Upsert the reaction (user can only have one reaction per comment)
    const reaction = await prisma.predictionCommentReaction.upsert({
      where: {
        userId_predictionCommentId: {
          userId,
          predictionCommentId: parseInt(commentId),
        },
      },
      update: {
        reactionTypeId: parseInt(reactionTypeId),
      },
      create: {
        userId,
        predictionCommentId: parseInt(commentId),
        reactionTypeId: parseInt(reactionTypeId),
      },
      include: {
        reactionType: {
          select: {
            id: true,
            name: true,
            emoji: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ reaction });
  } catch (error) {
    console.error("Error adding reaction to prediction comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId parameter" }, { status: 400 });
    }

    // Delete the reaction
    await prisma.predictionCommentReaction.deleteMany({
      where: {
        userId,
        predictionCommentId: parseInt(commentId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction from prediction comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
