import { NextRequest, NextResponse } from "next/server";
import { getCommentsForDiscussion, getCommentStats } from "@/lib/comments";
import { auth } from "@clerk/nextjs/server";
import { VoteValue } from "@prisma/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ discussionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const { searchParams } = new URL(request.url);
        
        const discussionId = parseInt(resolvedParams.discussionId);
        const sort = searchParams.get("sort") as "new" | "top" | "best" || "new";
        const parentId = searchParams.get("parentId") ? parseInt(searchParams.get("parentId")!) : undefined;
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const tree = searchParams.get("tree") === "true";
        const maxDepth = parseInt(searchParams.get("maxDepth") || "1"); // Default to 1 level deep

        // Get current user ID from Clerk authentication
        const { userId } = await auth();
        const currentUserId = userId || undefined;

        const comments = await getCommentsForDiscussion(
            discussionId,
            sort,
            parentId,
            limit,
            offset,
            currentUserId,
            maxDepth
        );
        
        

        const result: { comments: unknown; stats?: unknown; pagination?: unknown } = { comments };

        if (!parentId) {
            // Only get stats for top-level comments
            const stats = await getCommentStats(discussionId);
            result.stats = stats;
            result.pagination = {
                hasMore: comments.length === limit,
                total: stats.topLevelComments,
            };
        }

        if (tree) {
            // Comments are already in tree structure from Prisma, just convert to CommentTree format
            const { wilsonScore } = await import("@/lib/comments-types");
            const commentTree = comments.map(comment => {
                const upvotes = comment.votes.filter((v) => v.value === VoteValue.UPVOTE).length;
                const downvotes = comment.votes.filter((v) => v.value === VoteValue.DOWNVOTE).length;
                return {
                    ...comment,
                    replies: comment.replies || [],
                    score: upvotes - downvotes,
                    wilsonScore: wilsonScore(upvotes, downvotes),
                    userVote: currentUserId ? comment.votes.find((v) => v.userId === currentUserId)?.value : undefined,
                };
            });
            result.comments = commentTree;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}
