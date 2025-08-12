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
    const { commentId, value } = body;

    if (!commentId || !value || !["UPVOTE", "DOWNVOTE"].includes(value)) {
      return NextResponse.json(
        { error: "Missing required fields: commentId and value (UPVOTE or DOWNVOTE)" },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await prisma.discussionComment.findUnique({
      where: { id: parseInt(commentId) },
      select: { id: true }
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Upsert the vote
    const vote = await prisma.discussionCommentVote.upsert({
      where: {
        discussionCommentId_userId: {
          discussionCommentId: parseInt(commentId),
          userId,
        },
      },
      update: {
        value: value as "UPVOTE" | "DOWNVOTE",
      },
      create: {
        discussionCommentId: parseInt(commentId),
        userId,
        value: value as "UPVOTE" | "DOWNVOTE",
      },
    });

    // Get updated vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.discussionCommentVote.count({
        where: {
          discussionCommentId: parseInt(commentId),
          value: "UPVOTE",
        },
      }),
      prisma.discussionCommentVote.count({
        where: {
          discussionCommentId: parseInt(commentId),
          value: "DOWNVOTE",
        },
      }),
    ]);

    const score = upvotes - downvotes;

    return NextResponse.json({
      vote,
      score,
      upvotes,
      downvotes,
    });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
