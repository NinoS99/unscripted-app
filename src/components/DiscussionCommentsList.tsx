"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FiSend, FiChevronDown } from "react-icons/fi";
import DiscussionComment from "./DiscussionComment";
import { CommentTree, SortMode } from "@/lib/comments";
import { useDynamicMaxDepth } from "@/hooks/useDynamicMaxDepth";


interface CommentStats {
  totalComments: number;
  topLevelComments: number;
  maxDepth: number;
}

interface DiscussionCommentsListProps {
  discussionId: number;
}

export default function DiscussionCommentsList({ discussionId }: DiscussionCommentsListProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const { maxDepth, containerRef } = useDynamicMaxDepth();
  const [comments, setComments] = useState<CommentTree[]>([]);
  
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [sort, setSort] = useState<SortMode>("new");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const currentOffset = useRef(0);
  const isFetching = useRef(false);
  const initialLoad = 20;
  const loadMoreAmount = 50;

 
  const fetchComments = useCallback(async (isInitialLoad = true) => {
    // Prevent multiple simultaneous calls
    if (isFetching.current) return;
    isFetching.current = true;
    
    if (isInitialLoad) {
      setIsLoading(true);
      currentOffset.current = 0;
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const limit = isInitialLoad ? initialLoad : loadMoreAmount;
      const offset = isInitialLoad ? 0 : currentOffset.current;
      
      const response = await fetch(
        `/api/discussions/comments/${discussionId}?sort=${sort}&limit=${limit}&offset=${offset}&tree=true&maxDepth=${maxDepth}`
      );

      if (response.ok) {
        const data = await response.json();
        const newComments = data.comments || [];
        
        
        if (isInitialLoad) {
          setComments(newComments);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }
        
        
        
        // Update the offset for next load
        currentOffset.current = offset + newComments.length;
        
        setStats(data.stats || null);
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      isFetching.current = false;
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [discussionId, sort, maxDepth, initialLoad, loadMoreAmount]);

  useEffect(() => {
    fetchComments(true);
  }, [discussionId, sort, fetchComments]);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/discussions/comments/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discussionId,
          content: newComment.trim(),
          spoiler,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment("");
        setSpoiler(false);
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            totalComments: prev.totalComments + 1,
            topLevelComments: prev.topLevelComments + 1,
          } : null);
        }
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

  const handleSortChange = (newSort: SortMode) => {
    setSort(newSort);
    setComments([]);
    setHasMore(false);
    currentOffset.current = 0;
  };

  const handleCommentAdded = () => {
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        totalComments: prev.totalComments + 1,
      } : null);
    }
  };

  const handleVoteChange = () => {
    // Refresh comments to get updated vote counts
    fetchComments(true);
  };

  const handleReactionChange = () => {
    // Refresh comments to get updated reaction counts
    fetchComments(true);
  };

  const handleLoadMore = () => {
    fetchComments(false);
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 bg-gray-700 rounded"></div>
                <div className="flex-grow">
                  <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-500">
          Comments {stats && `(${stats.totalComments})`}
        </h3>
        
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortMode)}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-green-400"
          >
            <option value="new">New</option>
            <option value="top">Top</option>
            <option value="best">Best</option>
          </select>
        </div>
      </div>

      <div className="border-b border-gray-600 mb-4"></div>
      
      {/* Add Comment Form */}
      {user && (
        <div className="mb-6">
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
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none"
              />
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={spoiler}
                      onChange={(e) => setSpoiler(e.target.checked)}
                      className="rounded text-green-600"
                      style={{ accentColor: "#16a34a" }}
                    />
                    Spoiler
                  </label>
                </div>
                
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
            {/* Comments */}
            {comments.map((comment) => (
              <DiscussionComment
                key={comment.id}
                comment={comment}
                discussionId={discussionId}
                onCommentAdded={handleCommentAdded}
                onVoteChange={handleVoteChange}
                onReactionChange={handleReactionChange}
                maxDepth={maxDepth}
                currentDepth={0}
              />
            ))}
            
            {/* Show More Button */}
            {hasMore && (
              <div className="flex items-center justify-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-3 text-sm border border-gray-600 text-gray-300 rounded hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading more comments...
                    </>
                  ) : (
                    <>
                      <FiChevronDown className="w-4 h-4" />
                      Show More Comments
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Sign in prompt for non-authenticated users */}
      {!user && (
        <div className="mt-4">
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
