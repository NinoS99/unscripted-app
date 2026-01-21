import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import { VoteValue } from "@prisma/client";
import { trackEngagementSingle } from "@/lib/activityTracker";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, value } = body;

    if (!commentId || !value) {
      return NextResponse.json(
        { error: "Missing required fields: commentId and value (UPVOTE or DOWNVOTE)" },
        { status: 400 }
      );
    }

    // Convert database value ("1" or "-1") to enum
    // Prisma enums with @map: database stores "-1"/"1", but Prisma client expects enum names "UPVOTE"/"DOWNVOTE"
    const valueStr = String(value).trim();
    let voteValue: VoteValue;
    
    if (valueStr === "1") {
      // Prisma expects the enum name, not the mapped value
      voteValue = "UPVOTE" as VoteValue;
    } else if (valueStr === "-1") {
      // Prisma expects the enum name, not the mapped value
      voteValue = "DOWNVOTE" as VoteValue;
    } else {
      return NextResponse.json(
        { error: `Invalid value. Must be "1" (UPVOTE) or "-1" (DOWNVOTE). Received: ${JSON.stringify(value)}` },
        { status: 400 }
      );
    }

    // Check if comment exists and get author with prediction details
    const comment = await prisma.predictionComment.findUnique({
      where: { id: parseInt(commentId) },
      select: {
        id: true,
        userId: true,
        predictionId: true,
        user: { select: { username: true } },
        prediction: {
          select: {
            title: true,
            userId: true,
            predictionText: true,
            user: { select: { username: true } },
            episode: {
              select: {
                id: true,
                name: true,
                episodeNumber: true,
                season: {
                  select: {
                    seasonNumber: true,
                    show: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Upsert the vote
    const vote = await prisma.predictionCommentVote.upsert({
      where: {
        predictionCommentId_userId: {
          predictionCommentId: parseInt(commentId),
          userId,
        },
      },
      update: {
        value: voteValue,
      },
      create: {
        predictionCommentId: parseInt(commentId),
        userId,
        value: voteValue,
      },
    });

    // Get updated vote counts
    // Use enum names, not mapped values
    const [upvotes, downvotes] = await Promise.all([
      prisma.predictionCommentVote.count({
        where: {
          predictionCommentId: parseInt(commentId),
          value: "UPVOTE" as VoteValue,
        },
      }),
      prisma.predictionCommentVote.count({
        where: {
          predictionCommentId: parseInt(commentId),
          value: "DOWNVOTE" as VoteValue,
        },
      }),
    ]);

    const score = upvotes - downvotes;

    // Track engagement and award points to comment author
    if (comment.userId !== userId) {
      const episodeName = `${comment.prediction.episode.season.show.name} Season ${comment.prediction.episode.season.seasonNumber}, Episode ${comment.prediction.episode.episodeNumber}: ${comment.prediction.episode.name}`;

      const activityType = (voteValue as string) === "UPVOTE" ? "COMMENT_UPVOTED" : "COMMENT_DOWNVOTED";
      await trackEngagementSingle(
        userId, // giver
        comment.userId, // receiver
        activityType,
        "COMMENT",
        parseInt(commentId),
        `Comment ${(voteValue as string) === "UPVOTE" ? "upvoted" : "downvoted"}`,
        {
          receiverUsername: comment.user.username,
          predictionId: comment.predictionId,
          predictionTitle: comment.prediction.title,
          predictionText: comment.prediction.predictionText,
          predictionAuthorUsername: comment.prediction.user.username,
          episodeId: comment.prediction.episode.id,
          episodeName,
          showId: comment.prediction.episode.season.show.id,
          showName: comment.prediction.episode.season.show.name,
        }
      );
    }

    return NextResponse.json({
      vote,
      score,
      upvotes,
      downvotes,
    });
  } catch (error) {
    console.error("Error voting on prediction comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
