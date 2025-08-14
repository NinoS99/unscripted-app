"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { FiSend, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Comment {
    id: number;
    content: string;
    createdAt: Date;
    user: {
        id: string;
        username: string;
        profilePicture?: string | null;
    };
}

interface CommentsProps {
    entityType: "review" | "watchList";
    entityId: number;
    comments: Comment[];
    onCommentAdded: (comment: Comment) => void;
    reviewType?: "show" | "season" | "episode";
}

export default function Comments({ entityType, entityId, comments: initialComments, onCommentAdded, reviewType }: CommentsProps) {
    const { user } = useUser();
    const pathname = usePathname();
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 10;

    const handleSubmitComment = async () => {
        if (!user || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const endpoint = entityType === "review" 
                ? "/api/reviews/comments"
                : "/api/watch-lists/comments";
            
            const body = entityType === "review" 
                ? {
                    reviewType: reviewType || "show",
                    reviewId: entityId,
                    content: newComment.trim(),
                }
                : {
                    watchListId: entityId,
                    content: newComment.trim(),
                };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const newCommentData = await response.json();
                const comment = newCommentData.comment;
                setComments(prev => [comment, ...prev]);
                onCommentAdded(comment);
                setNewComment("");
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

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-green-500 mb-4">Comments ({comments.length})</h3>
            <div className="border-b border-gray-600 mb-4"></div>
            
            {/* Add Comment Form */}
            {user && (
                <div className="mb-4">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <Image
                                src={user.imageUrl || "/noAvatar.png"}
                                alt={user.username || "User"}
                                width={40}
                                height={40}
                                className="rounded-full object-cover h-10 w-10"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/noAvatar.png";
                                }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
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
            <div className="space-y-0">
                {comments.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    <>
                        {/* Paginated Comments */}
                        {comments
                            .slice((currentPage - 1) * commentsPerPage, currentPage * commentsPerPage)
                            .map((comment) => (
                                <div key={comment.id} className="py-4 border-b border-gray-700">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0">
                                            <Image
                                                src={comment.user.profilePicture || "/noAvatar.png"}
                                                alt={comment.user.username}
                                                width={40}
                                                height={40}
                                                className="rounded-full object-cover h-10 w-10"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/noAvatar.png";
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Link 
                                                    href={`/${comment.user.username}`}
                                                    className="font-semibold text-white hover:text-green-400 transition-colors"
                                                >
                                                    {comment.user.username}
                                                </Link>
                                                <span className="text-sm text-gray-400">
                                                    {format(new Date(comment.createdAt), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                            <p className="text-gray-200 whitespace-pre-wrap break-words overflow-hidden w-full max-w-full word-break-break-word break-all pr-4">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        
                        {/* Pagination */}
                        <div className="flex items-center justify-center gap-3 py-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || comments.length <= commentsPerPage}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-600 text-gray-300 rounded hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiChevronLeft className="w-3 h-3" />
                                Previous
                            </button>
                            
                            <span className="text-sm text-gray-400">
                                Page {currentPage} of {Math.max(1, Math.ceil(comments.length / commentsPerPage))}
                            </span>
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(comments.length / commentsPerPage), prev + 1))}
                                disabled={currentPage === Math.ceil(comments.length / commentsPerPage) || comments.length <= commentsPerPage}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-600 text-gray-300 rounded hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <FiChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            {/* Sign in prompt for non-authenticated users */}
            {!user && (
                <div className="mt-1">
                    <p className="text-gray-400 text-sm">
                        <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`} className="text-green-400 hover:text-green-300 transition-colors font-medium">
                            Sign in
                        </Link>{" "}
                        to leave a comment
                    </p>
                </div>
            )}
        </div>
    );
} 