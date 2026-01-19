import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addPredictionComment } from "@/lib/comments";
import { trackUserActivity } from "@/lib/activityTracker";
import prisma from "@/lib/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { predictionId, content, parentId } = body;

    if (!predictionId || !content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: predictionId and content" },
        { status: 400 }
      );
    }

    if (content.trim().length > 10000) {
      return NextResponse.json(
        { error: "Comment content too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    const comment = await addPredictionComment(
      parseInt(predictionId),
      userId,
      content.trim(),
      parentId ? parseInt(parentId) : undefined
    );

    // Get prediction details for activity tracking
    const prediction = await prisma.prediction.findUnique({
      where: { id: parseInt(predictionId) },
      select: {
        userId: true,
        title: true,
        predictionText: true,
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
    });

    if (prediction) {
      // Track user activity (no points awarded for comments)
      // userId = prediction owner (who received the comment), giverId = commenter (who made the comment)
      await trackUserActivity({
        userId: prediction.userId, // Prediction owner
        activityType: "COMMENT_CREATED",
        entityType: "COMMENT",
        entityId: comment.id,
        description: "Created a prediction comment",
        metadata: {
          contentType: "prediction",
          contentName: prediction.title,
          predictionId: parseInt(predictionId),
          commentLength: content.trim().length,
          isReply: !!parentId,
          depth: comment.depth,
          isPreClose: comment.isPreClose,
          predictionText: prediction.predictionText,
          episodeId: prediction.episode.id,
          episodeName: `${prediction.episode.season.show.name} Season ${prediction.episode.season.seasonNumber}, Episode ${prediction.episode.episodeNumber}: ${prediction.episode.name}`,
          showId: prediction.episode.season.show.id,
          showName: prediction.episode.season.show.name,
        },
        giverId: userId, // Commenter
      });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error adding prediction comment:", error);

    if (error instanceof Error) {
      if (error.message.includes("Parent comment not found")) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
      if (error.message.includes("Comment nesting too deep")) {
        return NextResponse.json({ error: "Comment nesting too deep" }, { status: 400 });
      }
      if (error.message.includes("Parent comment does not belong to this prediction")) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }
      if (error.message.includes("Prediction not found")) {
        return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
