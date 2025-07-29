"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { format } from "date-fns";
import { FiSend } from "react-icons/fi";

interface ReviewComment {
    id: number;
    content: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        profilePicture: string | null;
    };
}

interface ReviewCommentsProps {
    reviewType: "show" | "season" | "episode";
    reviewId: number;
}

export default function ReviewComments({ reviewType, reviewId }: ReviewCommentsProps) {
    const { user } = useUser();
    const [comments, setComments] = useState<ReviewComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/reviews/comments?reviewType=${reviewType}&reviewId=${reviewId}`
            );
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setIsLoading(false);
        }
    }, [reviewType, reviewId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmitComment = async () => {
        if (!user || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/reviews/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reviewType,
                    reviewId,
                    content: newComment.trim(),
                }),
            });

            if (response.ok) {
                setNewComment("");
                // Fetch updated comments
                await fetchComments();
            } else {
                const error = await response.json();
                console.error("Failed to add comment:", error);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    if (isLoading) {
        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-green-500 mb-4">Comments</h3>
                <div className="text-gray-400 text-center py-4">Loading comments...</div>
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-green-500 mb-4">Comments</h3>
            
            {/* Add Comment Form */}
            {user && (
                <div className="mb-6">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <Image
                                src={user.imageUrl?.includes('clerk.com') 
                                    ? user.imageUrl 
                                    : `${user.imageUrl || "/noAvatar.png"}?v=${user.id}`}
                                alt={user.username || "User"}
                                width={40}
                                height={40}
                                className="rounded-full object-cover h-10 w-10"
                            />
                        </div>
                        <div className="flex-grow">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Add a comment..."
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={isSubmitting || !newComment.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? (
                                        "Posting..."
                                    ) : (
                                        <>
                                            <FiSend className="w-4 h-4" />
                                            Post Comment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="flex-shrink-0">
                                <Image
                                    src={comment.user.profilePicture?.includes('clerk.com') 
                                        ? comment.user.profilePicture 
                                        : `${comment.user.profilePicture || "/noAvatar.png"}?v=${comment.user.id}`}
                                    alt={comment.user.username}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover h-10 w-10"
                                />
                            </div>
                            <div className="flex-grow">
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-white">
                                            {comment.user.username}
                                        </span>
                                        <span className="text-sm text-gray-400">
                                            {format(new Date(comment.createdAt), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                    <p className="text-gray-200 whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 