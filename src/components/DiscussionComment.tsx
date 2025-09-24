"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import {
    FiChevronUp,
    FiChevronDown,
    FiCornerUpLeft,
    FiX,
    FiTrash2,
} from "react-icons/fi";
import CommentReactions from "./CommentReactions";
import { formatRelativeTime } from "@/lib/utils";
import { useModalScrollPrevention } from "@/hooks/useModalScrollPrevention";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface CommentWithUser {
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
    maxDepth: number;
    currentDepth?: number;
}



// New component for the thread modal
function ThreadModal({
    comment,
    discussionId,
    onClose,
    onCommentAdded,
    onVoteChange,
    onReactionChange,
    maxDepth,
}: {
    comment: CommentTree;
    discussionId: number;
    onClose: () => void;
    onCommentAdded: () => void;
    onVoteChange: () => void;
    onReactionChange: () => void;
    maxDepth: number;
}) {
    const [threadComments, setThreadComments] = useState<CommentTree[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal scroll prevention and escape key handling
    useModalScrollPrevention(true);
    useEscapeKey(true, onClose);

    // Load the full thread when modal opens
    useEffect(() => {
        const loadFullThread = async () => {
            try {
                const response = await fetch(
                    `/api/discussions/comments/${discussionId}?parentId=${comment.id}&limit=100&maxDepth=10`
                );
                if (response.ok) {
                    const data = await response.json();
                    setThreadComments(data.comments || []);
                }
            } catch (error) {
                console.error("Error loading full thread:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadFullThread();
    }, [comment.id, discussionId]);

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm md:bg-white/5 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="modal-content bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <Image
                            src={comment.user.imageUrl || "/noAvatar.png"}
                            alt={comment.user.username}
                            width={32}
                            height={32}
                            className="rounded-full"
                        />
                        <div>
                            <Link
                                href={`/${comment.user.username}`}
                                className="font-semibold text-white hover:text-green-400 transition-colors"
                            >
                                {comment.user.username}
                            </Link>
                            <div className="text-sm text-gray-400">
                                {formatRelativeTime(
                                    new Date(comment.createdAt)
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Original Comment */}
                <div className="p-4 border-b border-gray-700">
                    <div className="text-gray-200 whitespace-pre-wrap break-words overflow-hidden w-full max-w-full pr-4">
                        {comment.content}
                    </div>
                </div>

                {/* Thread Comments */}
                <div className="overflow-y-auto max-h-[60vh]">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-400">
                            Loading thread...
                        </div>
                    ) : threadComments.length > 0 ? (
                        <div className="p-4">
                            {threadComments.map((threadComment) => (
                                <DiscussionComment
                                    key={threadComment.id}
                                    comment={threadComment}
                                    discussionId={discussionId}
                                    onCommentAdded={onCommentAdded}
                                    onVoteChange={onVoteChange}
                                    onReactionChange={onReactionChange}
                                    maxDepth={maxDepth}
                                    currentDepth={0}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-400">
                            No replies in this thread
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DiscussionComment({
    comment,
    discussionId,
    onCommentAdded,
    onVoteChange,
    onReactionChange,
    maxDepth,
    currentDepth = 0,
}: DiscussionCommentProps) {
    const { user } = useUser();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplies, setShowReplies] = useState(
        comment.depth === 0 && (comment.replies?.length || 0) > 0
    );
    const [replies, setReplies] = useState<CommentTree[]>(
        comment.replies || []
    );
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showSpoiler, setShowSpoiler] = useState(false);
    const [showThreadModal, setShowThreadModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<CommentTree | null>(null);

    // Check if we should show "Continue this thread" based on maxDepth
    const shouldShowContinueThread =
        comment._count.replies > 0 && currentDepth >= maxDepth;
    const canShowReplies = currentDepth < maxDepth;





    // Calculate score from votes
    const upvotes = comment.votes.filter((v) => v.value === "UPVOTE").length;
    const downvotes = comment.votes.filter(
        (v) => v.value === "DOWNVOTE"
    ).length;
    const score = upvotes - downvotes;

    const handleVote = async (value: "UPVOTE" | "DOWNVOTE") => {
        if (!user) return;

        // Optimistic update
        const previousVote = comment.userVote;

        // Update the comment object directly
        comment.userVote = value;
        comment.votes = comment.votes.filter((v) => v.userId !== user.id);
        comment.votes.push({
            id: Date.now(), // Temporary ID
            userId: user.id,
            value,
        });

        // Force re-render
        setReplies([...replies]);

        try {
            const response = await fetch("/api/discussions/comments/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId: comment.id, value }),
            });

            if (!response.ok) {
                // Revert on error
                comment.userVote = previousVote;
                comment.votes = comment.votes.filter(
                    (v) => v.userId !== user.id
                );
                if (previousVote) {
                    comment.votes.push({
                        id: Date.now(),
                        userId: user.id,
                        value: previousVote,
                    });
                }
                setReplies([...replies]);
            }
        } catch (error) {
            console.error("Error voting:", error);
            // Revert on error
            comment.userVote = previousVote;
            comment.votes = comment.votes.filter((v) => v.userId !== user.id);
            if (previousVote) {
                comment.votes.push({
                    id: Date.now(),
                    userId: user.id,
                    value: previousVote,
                });
            }
            setReplies([...replies]);
        }
    };

    const handleSubmitReply = async () => {
        if (!user || !replyContent.trim() || isSubmitting) return;

        const replyContentToSubmit = replyContent.trim();
        setIsSubmitting(true);

        // Optimistic update - create a temporary reply
        const tempReply: CommentTree = {
            id: Date.now(), // Temporary ID
            content: replyContentToSubmit,
            userId: user.id,
            discussionId,
            parentId: comment.id,
            depth: comment.depth + 1,
            path: comment.path + "/" + Date.now(),
            spoiler: false,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
                id: user.id,
                username: user.username || "User",
                imageUrl: user.imageUrl,
            },
            _count: {
                replies: 0,
                votes: 0,
            },
            votes: [],
            reactions: [],
            replies: [],
            score: 0,
            userVote: undefined,
        };

        // Add to replies immediately
        setReplies((prev) => [tempReply, ...prev]);
        setReplyContent("");
        setShowReplyForm(false);
        setShowReplies(true);
        setIsCollapsed(false);

        try {
            const response = await fetch("/api/discussions/comments/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discussionId,
                    content: replyContentToSubmit,
                    parentId: comment.id,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Replace temp reply with real one
                setReplies((prev) =>
                    prev.map((reply) =>
                        reply.id === tempReply.id ? data.comment : reply
                    )
                );
            } else {
                // Remove temp reply on error
                setReplies((prev) =>
                    prev.filter((reply) => reply.id !== tempReply.id)
                );
            }
        } catch (error) {
            console.error("Error adding reply:", error);
            // Remove temp reply on error
            setReplies((prev) =>
                prev.filter((reply) => reply.id !== tempReply.id)
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadMoreReplies = async () => {
        if (isLoadingReplies) return;

        setIsLoadingReplies(true);
        try {
            const response = await fetch(
                `/api/discussions/comments/${discussionId}?parentId=${comment.id}&limit=10&maxDepth=${maxDepth}`
            );

            if (response.ok) {
                const data = await response.json();
                const newReplies = data.comments || [];
                
                
                // Replace replies instead of appending to avoid duplicates
                setReplies(newReplies);
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

    const handleDeleteClick = (commentToDelete: CommentTree) => {
        setCommentToDelete(commentToDelete);
    };

    const handleDeleteConfirm = async () => {
        if (!user || isDeleting || !commentToDelete) return;

        setIsDeleting(true);

        // Optimistic update
        const wasDeleted = commentToDelete.isDeleted;
        commentToDelete.isDeleted = true;
        setReplies([...replies]); // Force re-render

        try {
            const response = await fetch(
                `/api/discussions/comments/delete/${commentToDelete.id}`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!response.ok) {
                // Revert on error
                commentToDelete.isDeleted = wasDeleted;
                setReplies([...replies]);
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
            // Revert on error
            commentToDelete.isDeleted = wasDeleted;
            setReplies([...replies]);
        } finally {
            setIsDeleting(false);
            setCommentToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setCommentToDelete(null);
    };

    return (
        <>
            <div
                className={`py-4 bg-gray-900 ${
                    comment.depth > 0
                        ? "border-l-2 border-gray-700 ml-2 md:ml-4"
                        : ""
                }`}
            >
                <div className="flex gap-2 md:gap-3 ml-2">
                    {/* Vote buttons - always show space to maintain layout */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        {!comment.isDeleted ? (
                            <>
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
                            </>
                        ) : (
                            // Invisible placeholder to maintain spacing for deleted comments
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-3 h-3 md:w-4 md:h-4"></div>
                                <div className="w-4 h-4 md:w-5 md:h-5"></div>
                                <div className="w-3 h-3 md:w-4 md:h-4"></div>
                            </div>
                        )}
                    </div>

                    {/* Comment content */}
                    <div className="flex-1 min-w-0">
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
                                {formatRelativeTime(
                                    new Date(comment.createdAt)
                                )}
                            </span>
                            {comment.spoiler && !comment.isDeleted && (
                                <button
                                    onClick={() => setShowSpoiler(!showSpoiler)}
                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                                >
                                    {showSpoiler
                                        ? "Hide spoiler"
                                        : "Show spoiler"}
                                </button>
                            )}
                        </div>

                        <div className="relative mb-3 w-full pr-4">
                            {commentToDelete?.id === comment.id ? (
                                // Delete confirmation view
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                    <p className="text-red-300 text-sm mb-3">
                                        Are you sure you want to delete this comment? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDeleteCancel}
                                            disabled={isDeleting}
                                            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteConfirm}
                                            disabled={isDeleting}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <FiTrash2 className="w-3 h-3" />
                                                    Delete
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`text-gray-200 whitespace-pre-wrap break-words overflow-hidden w-full max-w-full word-break-break-word break-all ${
                                        comment.spoiler && !showSpoiler && !comment.isDeleted
                                            ? "blur-sm select-none"
                                            : ""
                                    } ${
                                        comment.isDeleted
                                            ? "italic text-gray-500"
                                            : ""
                                    }`}
                                >
                                    {comment.isDeleted
                                        ? "comment deleted"
                                        : comment.content}
                                </div>
                            )}
                        </div>

                        {/* Reactions display */}
                        {!comment.isDeleted && (
                            <div className="mb-2">
                                <CommentReactions
                                    commentId={comment.id}
                                    reactions={comment.reactions}
                                    onReactionChange={() => {
                                        // Force re-render to show updated reactions
                                        setReplies([...replies]);
                                    }}
                                    showOnlyDisplay={true}
                                />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 md:gap-2 text-xs md:text-sm flex-wrap">
                            {/* Delete button - only show to comment author */}
                            {user &&
                                comment.userId === user.id &&
                                !comment.isDeleted && (
                                    <button
                                        onClick={() =>
                                            handleDeleteClick(comment)
                                        }
                                        disabled={isDeleting}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        title="Delete comment"
                                    >
                                        <FiTrash2 className="w-3 h-3" />
                                    </button>
                                )}

                            {/* Add/Change reaction button */}
                            {!comment.isDeleted && (
                                <CommentReactions
                                    commentId={comment.id}
                                    reactions={comment.reactions}
                                    onReactionChange={() => {
                                        // Force re-render to show updated reactions
                                        setReplies([...replies]);
                                    }}
                                    showOnlyButton={true}
                                    hideButtonText={
                                        comment.parentId ? true : false
                                    }
                                />
                            )}

                            {user &&
                                !comment.isDeleted &&
                                comment.depth < 10 && (
                                    <button
                                        onClick={() =>
                                            setShowReplyForm((v) => !v)
                                        }
                                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <FiCornerUpLeft className="w-3 h-3" />
                                        {comment.parentId ? null : "Reply"}
                                    </button>
                                )}

                            {/* Show/Hide replies button */}
                            {comment._count.replies > 0 && canShowReplies && (
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

                            {/* Continue this thread button */}
                            {shouldShowContinueThread && (
                                <button
                                    onClick={() => setShowThreadModal(true)}
                                    className="text-green-400 hover:text-green-300 transition-colors"
                                >
                                    Continue this thread →
                                </button>
                            )}
                        </div>

                        {/* Reply form */}
                        {showReplyForm && (
                            <div className="mt-4">
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0">
                                        <Image
                                            src={
                                                user?.imageUrl ||
                                                "/noAvatar.png"
                                            }
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
                                    <div className="flex-1 min-w-0">
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
                                        <div className="flex justify-end gap-2 mt-2 w-full">
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
                        {showReplies &&
                            replies.length > 0 &&
                            !isCollapsed &&
                            canShowReplies && (
                                <div className="mt-4 space-y-0 -mr-2 md:-mr-0">
                                    {replies.map((reply) => (
                                        <DiscussionComment
                                            key={reply.id}
                                            comment={reply}
                                            discussionId={discussionId}
                                            onCommentAdded={onCommentAdded}
                                            onVoteChange={onVoteChange}
                                            onReactionChange={onReactionChange}
                                            maxDepth={maxDepth}
                                            currentDepth={currentDepth + 1}
                                        />
                                    ))}
                                </div>
                            )}
                    </div>
                </div>
            </div>



            {/* Thread Modal */}
            {showThreadModal && (
                <ThreadModal
                    comment={comment}
                    discussionId={discussionId}
                    onClose={() => setShowThreadModal(false)}
                    onCommentAdded={onCommentAdded}
                    onVoteChange={onVoteChange}
                    onReactionChange={onReactionChange}
                    maxDepth={maxDepth}
                />
            )}
        </>
    );
}
