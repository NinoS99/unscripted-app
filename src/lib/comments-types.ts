import { VoteValue } from "@prisma/client";

// Base comment type from Prisma
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
        value: VoteValue;
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

export interface CommentWithUser extends PrismaComment {
    user: {
        id: string;
        username: string;
        imageUrl?: string | null;
    };
}

export interface CommentTree extends CommentWithUser {
    replies: CommentTree[];
    score: number;
    wilsonScore: number;
    userVote?: VoteValue;
}

export type SortMode = "new" | "top" | "best";

/**
 * Wilson Score algorithm for ranking comments
 */
export function wilsonScore(upvotes: number, downvotes: number): number {
    const n = upvotes + downvotes;
    if (n === 0) return 0;

    const z = 1.281551565545; // 80% confidence
    const p = upvotes / n;
    const numerator =
        p +
        (z * z) / (2 * n) -
        z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
    const denominator = 1 + (z * z) / n;
    return numerator / denominator;
}
