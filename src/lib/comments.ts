import prisma from "@/lib/client";
import { clerkClient } from "@clerk/nextjs/server";
import { VoteValue } from "@prisma/client";
import { CommentWithUser, CommentTree, SortMode, wilsonScore } from "./comments-types";

// Re-export types for backward compatibility
export type { CommentWithUser, CommentTree, SortMode };
export { wilsonScore };

// Base comment type from Prisma (used internally)
type PrismaComment = {
    id: number;
    content: string;
    userId: string;
    discussionId: number;
    parentId: number | null;
    depth: number;
    path: string;
    spoiler: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        username: string;
    };
    votes: Array<{
        id: number;
        userId: string;
        value: import("@prisma/client").VoteValue;
    }>;
    reactions: Array<{
        id: number;
        userId: string;
        reactionType: {
            id: number;
            name: string;
            emoji: string | null;
            category: string | null;
        };
    }>;
    _count: {
        replies: number;
        votes: number;
    };
    replies?: PrismaComment[];
};

/**
 * Pad a number to 6 digits for consistent path ordering
 */
function padId(id: number): string {
    return id.toString().padStart(6, "0");
}

/**
 * Fetch user image URLs from Clerk for a list of user IDs
 */
async function fetchUserImageUrls(
    userIds: string[]
): Promise<Record<string, string | null>> {
    const imageUrls: Record<string, string | null> = {};

    try {
        const clerk = await clerkClient();
        const uniqueUserIds = [...new Set(userIds)];

        for (const userId of uniqueUserIds) {
            try {
                const clerkUser = await clerk.users.getUser(userId);
                imageUrls[userId] = clerkUser?.imageUrl || null;
            } catch (error) {
                console.error(
                    `Failed to fetch Clerk user for ${userId}:`,
                    error
                );
                imageUrls[userId] = null;
            }
        }
    } catch (error) {
        console.error("Failed to initialize Clerk client:", error);
    }

    return imageUrls;
}

/**
 * Recursively collect user IDs from nested comments
 */
function collectUserIdsRecursive(comments: PrismaComment[], userIds: string[]): void {
    comments.forEach((comment) => {
        userIds.push(comment.user.id);
        if (comment.replies && comment.replies.length > 0) {
            collectUserIdsRecursive(comment.replies, userIds);
        }
    });
}

/**
 * Recursively add image URLs to comments
 */
function addImageUrlsRecursive(
    comments: PrismaComment[],
    userImageUrls: Record<string, string | null>
): CommentWithUser[] {
    return comments.map((comment) => ({
        ...comment,
        user: {
            ...comment.user,
            imageUrl: userImageUrls[comment.user.id] || null,
        },
        replies: comment.replies ? addImageUrlsRecursive(comment.replies, userImageUrls) : [],
    }));
}



/**
 * Add a new comment to a discussion
 */
export async function addComment(
    discussionId: number,
    userId: string,
    content: string,
    parentId?: number,
    spoiler: boolean = false
): Promise<CommentWithUser> {
    let path: string;
    let depth: number = 0;

    if (parentId) {
        // Get parent comment to build path
        const parent = await prisma.discussionComment.findUnique({
            where: { id: parentId },
            select: { path: true, depth: true, discussionId: true },
        });

        if (!parent) {
            throw new Error("Parent comment not found");
        }

        if (parent.discussionId !== discussionId) {
            throw new Error(
                "Parent comment does not belong to this discussion"
            );
        }

        depth = parent.depth + 1;
        if (depth > 10) {
            // Prevent excessive nesting
            throw new Error("Comment nesting too deep");
        }
    }

    // Create the comment first to get the ID
    const comment = await prisma.discussionComment.create({
        data: {
            content,
            userId,
            discussionId,
            parentId,
            depth,
            spoiler,
            path: "", // Temporary, will update after creation
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                },
            },
            votes: {
                select: {
                    id: true,
                    userId: true,
                    value: true,
                },
            },
            reactions: {
                select: {
                    id: true,
                    userId: true,
                    reactionType: {
                        select: {
                            id: true,
                            name: true,
                            emoji: true,
                            category: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    replies: true,
                    votes: true,
                },
            },
        },
    });

    // Build the path
    if (parentId) {
        const parent = await prisma.discussionComment.findUnique({
            where: { id: parentId },
            select: { path: true },
        });
        path = `${parent!.path}.${padId(comment.id)}`;
    } else {
        path = padId(comment.id);
    }

    // Update the comment with the correct path
    const updatedComment = await prisma.discussionComment.update({
        where: { id: comment.id },
        data: { path },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                },
            },
            votes: {
                select: {
                    id: true,
                    userId: true,
                    value: true,
                },
            },
            reactions: {
                select: {
                    id: true,
                    userId: true,
                    reactionType: {
                        select: {
                            id: true,
                            name: true,
                            emoji: true,
                            category: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    replies: true,
                    votes: true,
                },
            },
        },
    });

    // Fetch the user's image URL from Clerk
    const userImageUrls = await fetchUserImageUrls([userId]);
    const userImageUrl = userImageUrls[userId] || null;

    // Add the image URL to the comment
    return {
        ...updatedComment,
        user: {
            ...updatedComment.user,
            imageUrl: userImageUrl,
        },
    };
}

/**
 * Get comments for a discussion with various sorting options
 */
export async function getCommentsForDiscussion(
    discussionId: number,
    sort: SortMode = "new",
    parentId?: number | null,
    limit: number = 50,
    offset: number = 0,
    currentUserId?: string,
    maxDepth: number = 1 // Default to 1 level deep for initial render
): Promise<CommentWithUser[]> {
    const where = {
        discussionId,
        parentId: parentId ?? null,
    };

    let orderBy: { createdAt: "desc" | "asc" } = { createdAt: "desc" };

    switch (sort) {
        case "new":
            orderBy = { createdAt: "desc" };
            break;
        case "top":
            // For top sorting, we need to use raw SQL or calculate in application
            // For now, we'll fetch more and sort in application
            orderBy = { createdAt: "desc" };
            break;
        case "best":
            // For best sorting, we need to use raw SQL or calculate in application  
            // For now, we'll fetch more and sort in application
            orderBy = { createdAt: "desc" };
            break;
        default:
            orderBy = { createdAt: "desc" };
    }



    // For top and best sorting, we need to fetch more comments to sort properly
    const shouldFetchAll = sort === "top" || sort === "best";
    const fetchLimit = shouldFetchAll ? 1000 : limit; // Fetch more for proper sorting
    const fetchOffset = shouldFetchAll ? 0 : offset;

    const comments = await prisma.discussionComment.findMany({
        where,
        orderBy,
        take: fetchLimit,
        skip: fetchOffset,
        select: {
            id: true,
            content: true,
            userId: true,
            discussionId: true,
            parentId: true,
            depth: true,
            path: true,
            spoiler: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: {
                    id: true,
                    username: true,
                },
            },
            votes: {
                select: {
                    id: true,
                    userId: true,
                    value: true,
                },
            },
            reactions: {
                select: {
                    id: true,
                    userId: true,
                    reactionType: {
                        select: {
                            id: true,
                            name: true,
                            emoji: true,
                            category: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    replies: true,
                    votes: true,
                },
            },
            replies: maxDepth > 0 ? {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    votes: {
                        select: {
                            id: true,
                            userId: true,
                            value: true,
                        },
                    },
                    reactions: {
                        select: {
                            id: true,
                            userId: true,
                            reactionType: {
                                select: {
                                    id: true,
                                    name: true,
                                    emoji: true,
                                    category: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            replies: true,
                            votes: true,
                        },
                    },
                },
            } : false,
        },
    }) as PrismaComment[];



    // Helper function to process a comment and its nested replies
    const processCommentWithReplies = (comment: PrismaComment): CommentTree => {
        const upvotes = comment.votes.filter(
            (v: { value: VoteValue }) => v.value === VoteValue.UPVOTE
        ).length;
        const downvotes = comment.votes.filter(
            (v: { value: VoteValue }) => v.value === VoteValue.DOWNVOTE
        ).length;
        const score = upvotes - downvotes;
        const wilsonScoreValue = wilsonScore(upvotes, downvotes);
        const userVote = currentUserId
            ? comment.votes.find((v: { userId: string; value: string }) => v.userId === currentUserId)?.value
            : undefined;

        // Process nested replies recursively
        const processedReplies = comment.replies ? comment.replies.map(processCommentWithReplies) : [];


        return {
            ...comment,
            score,
            wilsonScore: wilsonScoreValue,
            userVote,
            replies: processedReplies,
        };
    };

    // Calculate scores and apply sorting
    const commentsWithScores = comments.map(processCommentWithReplies);
    

    // Apply sorting based on calculated scores
    if (sort === "top") {
        commentsWithScores.sort((a, b) => b.score - a.score);
    } else if (sort === "best") {
        commentsWithScores.sort((a, b) => b.wilsonScore - a.wilsonScore);
    }

    // Apply pagination after sorting for top/best
    let finalComments = commentsWithScores;
    if (shouldFetchAll) {
        finalComments = commentsWithScores.slice(offset, offset + limit);
    }

    // Collect all user IDs to fetch image URLs
    const userIds: string[] = [];
    collectUserIdsRecursive(finalComments, userIds);

    // Fetch user image URLs
    const userImageUrls = await fetchUserImageUrls(userIds);

    // Add image URLs to comments recursively
    return addImageUrlsRecursive(finalComments, userImageUrls);
}

/**
 * Build a comment tree from a flat array of comments
 */
export function buildCommentTree(comments: CommentWithUser[], currentUserId?: string): CommentTree[] {
    const commentMap = new Map<number, CommentTree>();
    const rootComments: CommentTree[] = [];

    // First pass: create all comment objects
    comments.forEach((comment) => {
        const upvotes = comment.votes.filter((v) => v.value === VoteValue.UPVOTE).length;
        const downvotes = comment.votes.filter((v) => v.value === VoteValue.DOWNVOTE).length;
        const score = upvotes - downvotes;
        const wilsonScoreValue = wilsonScore(upvotes, downvotes);
        
        const commentWithScore: CommentTree = {
            ...comment,
            replies: [],
            score,
            wilsonScore: wilsonScoreValue,
            userVote: currentUserId ? comment.votes.find((v) => v.userId === currentUserId)?.value : undefined,
        };
        commentMap.set(comment.id, commentWithScore);
    });

    // Second pass: build the tree structure
    comments.forEach((comment) => {
        const commentWithScore = commentMap.get(comment.id)!;

        if (comment.parentId) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
                parent.replies.push(commentWithScore);
            }
        } else {
            rootComments.push(commentWithScore);
        }
    });

    return rootComments;
}

/**
 * Get comment statistics for a discussion
 */
export async function getCommentStats(discussionId: number): Promise<{
    totalComments: number;
    topLevelComments: number;
    maxDepth: number;
}> {
    const [totalComments, topLevelComments, maxDepth] = await Promise.all([
        prisma.discussionComment.count({
            where: { discussionId },
        }),
        prisma.discussionComment.count({
            where: {
                discussionId,
                parentId: null,
            },
        }),
        prisma.discussionComment.aggregate({
            where: { discussionId },
            _max: { depth: true },
        }),
    ]);

    return {
        totalComments,
        topLevelComments,
        maxDepth: maxDepth._max.depth || 0,
    };
}
