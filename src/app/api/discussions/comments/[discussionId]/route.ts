import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCommentsForDiscussion, getCommentStats, SortMode, CommentTree, CommentWithUser } from "@/lib/comments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const resolvedParams = await params;
    
    const discussionId = parseInt(resolvedParams.discussionId);
    if (isNaN(discussionId)) {
      return NextResponse.json({ error: "Invalid discussion ID" }, { status: 400 });
    }

    const sort = (searchParams.get("sort") as SortMode) || "new";
    const parentId = searchParams.get("parentId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const tree = searchParams.get("tree") === "true";

    if (!["new", "top", "best"].includes(sort)) {
      return NextResponse.json({ error: "Invalid sort parameter" }, { status: 400 });
    }

    const comments = await getCommentsForDiscussion(
      discussionId,
      sort,
      parentId ? parseInt(parentId) : undefined,
      Math.min(limit, 100), // Cap at 100
      Math.max(offset, 0),
      userId || undefined
    );

    let result;
    if (tree && !parentId) {
      // Since getCommentsForDiscussion already returns nested replies, we need to process them
      // to add scores and userVote to all nested levels
      result = comments.map(comment => {
        const processComment = (c: CommentWithUser & { replies?: CommentWithUser[] }): CommentTree => {
          const upvotes = c.votes.filter((v) => v.value === "UPVOTE").length;
          const downvotes = c.votes.filter((v) => v.value === "DOWNVOTE").length;
          const score = upvotes - downvotes;
          const userVote = userId ? c.votes.find((v) => v.userId === userId)?.value : undefined;
          
          return {
            ...c,
            score,
            userVote,
            replies: c.replies ? c.replies.map(processComment) : [],
          };
        };
        return processComment(comment);
      });
    } else {
      // Return flat list for replies or when tree=false
      result = comments;
    }

    // Get comment stats if this is a top-level request
    let stats = null;
    if (!parentId) {
      stats = await getCommentStats(discussionId);
    }

    return NextResponse.json({
      comments: result,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: comments.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
