"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { FiChevronUp, FiChevronDown, FiCornerUpLeft } from "react-icons/fi";
import CommentReactions from "./CommentReactions";

interface CommentWithUser {
    id: number;
    content: string;
    userId: string;
    discussionId: number;
    parentId: number | null;
    depth: number;
    path: string;
    spoiler: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        username: string;
        imageUrl?: string | null;
    };
    _count: {
        replies: number;
        votes: number;
    };
    votes: Array<{
        id: number;
        userId: string;
        value: "UPVOTE" | "DOWNVOTE";
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
}

interface CommentTree extends CommentWithUser {
    replies: CommentTree[];
    score: number;
    userVote?: "UPVOTE" | "DOWNVOTE";
}

interface DiscussionCommentProps {
    comment: CommentTree;
    discussionId: number;
    onCommentAdded: () => void;
    onVoteChange: () => void;
    onReactionChange: () => void;
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
        if (diffInHours > 0) return `${diffInHours}h`;
        if (diffInMinutes > 0) return `${diffInMinutes}m`;
        if (diffInSeconds > 0) return `${diffInSeconds}s`;
        return "just now";
    }
    if (diffInDays === 1) return "1d";
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo`;
    return `${Math.floor(diffInDays / 365)}y`;
}

export default function DiscussionComment({
    comment,
    discussionId,
    onCommentAdded,
    onVoteChange,
    onReactionChange,
}: DiscussionCommentProps) {
    const { user } = useUser();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplies, setShowReplies] = useState(comment.depth === 0); // Only show replies for top-level comments initially
    const [replies, setReplies] = useState<CommentTree[]>(
        comment.replies || []
    );
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(comment.depth > 0); // All replies start collapsed
    const [showSpoiler, setShowSpoiler] = useState(false);

    // Calculate score from votes
    const upvotes = comment.votes.filter((v) => v.value === "UPVOTE").length;
    const downvotes = comment.votes.filter(
        (v) => v.value === "DOWNVOTE"
    ).length;
    const score = upvotes - downvotes;

    const handleVote = async (value: "UPVOTE" | "DOWNVOTE") => {
        if (!user) return;

        try {
            const response = await fetch("/api/discussions/comments/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId: comment.id, value }),
            });

            if (response.ok) {
                onVoteChange();
            }
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    const handleSubmitReply = async () => {
        if (!user || !replyContent.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/discussions/comments/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discussionId,
                    content: replyContent.trim(),
                    parentId: comment.id,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setReplies((prev) => [data.comment, ...prev]);
                setReplyContent("");
                setShowReplyForm(false);
                onCommentAdded();
            }
        } catch (error) {
            console.error("Error adding reply:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadMoreReplies = async () => {
        if (isLoadingReplies) return;

        setIsLoadingReplies(true);
        try {
            const response = await fetch(
                `/api/discussions/comments/${discussionId}?parentId=${comment.id}&limit=10`
            );

            if (response.ok) {
                const data = await response.json();
                // Replace replies instead of appending to avoid duplicates
                setReplies(data.comments);
                setShowReplies(true);
                setIsCollapsed(false); // Show replies immediately when loaded
            }
        } catch (error) {
            console.error("Error loading replies:", error);
        } finally {
            setIsLoadingReplies(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmitReply();
        }
    };

    return (
        <div
            className={`py-4 bg-gray-900 ${
                comment.depth > 0
                    ? "border-l-2 border-gray-700 ml-2 md:ml-4"
                    : ""
            }`}
        >
            <div className="flex gap-2 md:gap-3 ml-2">
                {/* Vote buttons */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => handleVote("UPVOTE")}
                        disabled={!user}
                        className={`p-1 rounded transition-colors ${
                            comment.userVote === "UPVOTE"
                                ? "text-green-500 bg-green-500/10"
                                : "text-gray-400 hover:text-green-500 hover:bg-green-500/10"
                        }`}
                    >
                        <FiChevronUp className="w-3 h-3 md:w-4 md:h-4" />
                    </button>

                    <span
                        className={`text-xs md:text-sm font-medium ${
                            score > 0
                                ? "text-green-500"
                                : score < 0
                                ? "text-red-500"
                                : "text-gray-400"
                        }`}
                    >
                        {score}
                    </span>

                    <button
                        onClick={() => handleVote("DOWNVOTE")}
                        disabled={!user}
                        className={`p-1 rounded transition-colors ${
                            comment.userVote === "DOWNVOTE"
                                ? "text-red-500 bg-red-500/10"
                                : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                        }`}
                    >
                        <FiChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                </div>

                {/* Comment content */}
                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Image
                            src={comment.user.imageUrl || "/noAvatar.png"}
                            alt={comment.user.username}
                            width={20}
                            height={20}
                            className="rounded-full md:w-6 md:h-6"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/noAvatar.png";
                            }}
                        />
                        <Link
                            href={`/${comment.user.username}`}
                            className="font-semibold text-white hover:text-green-400 transition-colors text-sm md:text-base"
                        >
                            {comment.user.username}
                        </Link>
                        <span className="text-xs md:text-sm text-gray-400">
                            {formatRelativeTime(new Date(comment.createdAt))}
                        </span>
                        {comment.spoiler && (
                            <button
                                onClick={() => setShowSpoiler(!showSpoiler)}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                            >
                                {showSpoiler ? 'Hide spoiler' : 'Show spoiler'}
                            </button>
                        )}
                    </div>

                    <div className="relative mb-3">
                        <div className={`text-gray-200 whitespace-pre-wrap ${comment.spoiler && !showSpoiler ? 'blur-sm select-none' : ''}`}>
                            {comment.content}
                        </div>
                    </div>

                    {/* Reactions display */}
                    <div className="mb-2">
                        <CommentReactions
                            commentId={comment.id}
                            reactions={comment.reactions}
                            onReactionChange={onReactionChange}
                            showOnlyDisplay={true}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 md:gap-2 text-xs md:text-sm flex-wrap">
                        {/* Add/Change reaction button */}
                        <CommentReactions
                            commentId={comment.id}
                            reactions={comment.reactions}
                            onReactionChange={onReactionChange}
                            showOnlyButton={true}
                            hideButtonText={comment.parentId ? true : false}
                        />

                        {user && (
                            <button
                                onClick={() => setShowReplyForm((v) => !v)}
                                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            >
                                <FiCornerUpLeft className="w-3 h-3" />
                                {comment.parentId ? null : "Reply"}
                            </button>
                        )}

                        {/* Show/Hide replies button */}
                        {comment._count.replies > 0 && (
                            <button
                                onClick={() => {
                                    if (!showReplies) {
                                        loadMoreReplies();
                                    } else {
                                        setIsCollapsed(!isCollapsed);
                                    }
                                }}
                                disabled={isLoadingReplies}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                {isLoadingReplies
                                    ? "Loading..."
                                    : !showReplies
                                    ? `Show ${comment._count.replies} replies`
                                    : isCollapsed
                                    ? `Show ${comment._count.replies} replies`
                                    : `Hide ${comment._count.replies} replies`}
                            </button>
                        )}
                    </div>

                    {/* Reply form */}
                    {showReplyForm && (
                        <div className="mt-4">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <Image
                                        src={user?.imageUrl || "/noAvatar.png"}
                                        alt={user?.username || "User"}
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                        onError={(e) => {
                                            const target =
                                                e.target as HTMLImageElement;
                                            target.src = "/noAvatar.png";
                                        }}
                                    />
                                </div>
                                <div className="flex-grow">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) =>
                                            setReplyContent(e.target.value)
                                        }
                                        onKeyPress={handleKeyPress}
                                        placeholder="Write a reply..."
                                        rows={3}
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={() =>
                                                setShowReplyForm(false)
                                            }
                                            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitReply}
                                            disabled={
                                                isSubmitting ||
                                                !replyContent.trim()
                                            }
                                            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting
                                                ? "Posting..."
                                                : "Reply"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Replies tree */}
                    {showReplies && replies.length > 0 && !isCollapsed && (
                        <div className="mt-4 space-y-0 -mr-2 md:-mr-0">
                            {replies.map((reply) => (
                                <DiscussionComment
                                    key={reply.id}
                                    comment={reply}
                                    discussionId={discussionId}
                                    onCommentAdded={onCommentAdded}
                                    onVoteChange={onVoteChange}
                                    onReactionChange={onReactionChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
