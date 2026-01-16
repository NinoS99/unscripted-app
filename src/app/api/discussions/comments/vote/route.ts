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

    if (!commentId || !value || !Object.values(VoteValue).includes(value as VoteValue)) {
      return NextResponse.json(
        { error: "Missing required fields: commentId and value (UPVOTE or DOWNVOTE)" },
        { status: 400 }
      );
    }

    // Check if comment exists and get author with discussion details
    const comment = await prisma.discussionComment.findUnique({
      where: { id: parseInt(commentId) },
      select: { 
        id: true, 
        userId: true,
        discussionId: true,
        user: { select: { username: true } },
        discussion: {
          select: {
            title: true,
            userId: true,
            showId: true,
            seasonId: true,
            episodeId: true,
            user: { select: { username: true } },
            show: { select: { name: true } },
            season: { select: { seasonNumber: true, show: { select: { name: true } } } },
            episode: { select: { name: true, episodeNumber: true, season: { select: { seasonNumber: true, show: { select: { name: true } } } } } }
          }
        }
      }
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
        value: value as VoteValue,
      },
      create: {
        discussionCommentId: parseInt(commentId),
        userId,
        value: value as VoteValue,
      },
    });

    // Get updated vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.discussionCommentVote.count({
        where: {
          discussionCommentId: parseInt(commentId),
          value: VoteValue.UPVOTE,
        },
      }),
      prisma.discussionCommentVote.count({
        where: {
          discussionCommentId: parseInt(commentId),
          value: VoteValue.DOWNVOTE,
        },
      }),
    ]);

    const score = upvotes - downvotes;

    // Track engagement and award points to comment author
    if (comment.userId !== userId) {
      // Determine the entity type and ID for the discussion
      let discussionEntityType: 'show' | 'season' | 'episode' = 'show';
      let discussionEntityId = comment.discussion.showId;
      
      if (comment.discussion.seasonId) {
        discussionEntityType = 'season';
        discussionEntityId = comment.discussion.seasonId;
      } else if (comment.discussion.episodeId) {
        discussionEntityType = 'episode';
        discussionEntityId = comment.discussion.episodeId;
      }

      // Build entity name
      const discussionAboutEntityName = comment.discussion.show?.name || 
                                       (comment.discussion.season ? `${comment.discussion.season.show.name} Season ${comment.discussion.season.seasonNumber}` : '') ||
                                       (comment.discussion.episode ? `${comment.discussion.episode.season.show.name} Season ${comment.discussion.episode.season.seasonNumber}, Episode ${comment.discussion.episode.episodeNumber}: ${comment.discussion.episode.name}` : '');

      const activityType = value === VoteValue.UPVOTE ? "COMMENT_UPVOTED" : "COMMENT_DOWNVOTED";
      await trackEngagementSingle(
        userId, // giver
        comment.userId, // receiver
        activityType,
        "COMMENT",
        parseInt(commentId),
        `Comment ${value.toLowerCase()}`,
        {
          receiverUsername: comment.user.username,
          discussionId: comment.discussionId,
          discussionTitle: comment.discussion.title,
          discussionAuthorUsername: comment.discussion.user.username,
          discussionAboutEntityType: discussionEntityType,
          discussionAboutEntityId: discussionEntityId,
          discussionAboutEntityName: discussionAboutEntityName
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
    console.error("Error voting on comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
