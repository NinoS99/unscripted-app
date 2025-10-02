import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addComment } from "@/lib/comments";
import { trackUserActivity } from "@/lib/activityTracker";
import prisma from "@/lib/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { discussionId, content, parentId, spoiler = false } = body;

    if (!discussionId || !content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: discussionId and content" },
        { status: 400 }
      );
    }

    if (content.trim().length > 10000) {
      return NextResponse.json(
        { error: "Comment content too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    const comment = await addComment(
      parseInt(discussionId),
      userId,
      content.trim(),
      parentId ? parseInt(parentId) : undefined,
      spoiler
    );

    // Get discussion details for activity tracking
    const discussion = await prisma.discussion.findUnique({
      where: { id: parseInt(discussionId) },
      select: { 
        userId: true,
        title: true,
        showId: true,
        seasonId: true,
        episodeId: true,
        show: { select: { name: true } },
        season: { select: { seasonNumber: true, show: { select: { name: true } } } },
        episode: { select: { name: true, episodeNumber: true, season: { select: { seasonNumber: true, show: { select: { name: true } } } } } }
      }
    });

    if (discussion) {
      // Determine the entity type and ID for the discussion
      let discussionEntityType: 'show' | 'season' | 'episode' = 'show';
      let discussionEntityId = discussion.showId;
      
      if (discussion.seasonId) {
        discussionEntityType = 'season';
        discussionEntityId = discussion.seasonId;
      } else if (discussion.episodeId) {
        discussionEntityType = 'episode';
        discussionEntityId = discussion.episodeId;
      }
      
      // Ensure entityId is not null
      if (!discussionEntityId) return NextResponse.json({ error: "Invalid discussion entity" }, { status: 400 });

      // Track user activity (no points awarded for comments)
      // userId = discussion owner (who received the comment), giverId = commenter (who made the comment)
      await trackUserActivity({
        userId: discussion.userId, // Discussion owner
        activityType: 'COMMENT_CREATED',
        entityType: 'COMMENT',
        entityId: comment.id,
        description: 'Created a discussion comment',
        metadata: {
          contentType: 'discussion',
          contentName: discussion.title,
          discussionId: parseInt(discussionId),
          commentLength: content.trim().length,
          isReply: !!parentId,
          depth: comment.depth,
          spoiler,
          entityType: discussionEntityType,
          entityId: discussionEntityId,
          entityName: discussion.title,
          // Include the entity the discussion is about
          discussionAboutEntityType: discussionEntityType,
          discussionAboutEntityId: discussionEntityId,
          discussionAboutEntityName: discussion.show?.name || 
                                    (discussion.season ? `${discussion.season.show.name} Season ${discussion.season.seasonNumber}` : '') ||
                                    (discussion.episode ? `${discussion.episode.season.show.name} Season ${discussion.episode.season.seasonNumber}, Episode ${discussion.episode.episodeNumber}: ${discussion.episode.name}` : '')
        },
        giverId: userId // Commenter
      });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Parent comment not found")) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
      if (error.message.includes("Comment nesting too deep")) {
        return NextResponse.json({ error: "Comment nesting too deep" }, { status: 400 });
      }
      if (error.message.includes("Parent comment does not belong to this discussion")) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
