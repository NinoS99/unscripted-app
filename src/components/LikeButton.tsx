"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { FiHeart } from "react-icons/fi";

interface LikeButtonProps {
    entityType: "comment" | "review" | "prediction" | "showReview" | "seasonReview" | "episodeReview";
    entityId: number;
    initialLikeCount?: number;
    initialIsLiked?: boolean;
    size?: "sm" | "md" | "lg";
    showCount?: boolean;
}

export default function LikeButton({
    entityType,
    entityId,
    initialLikeCount = 0,
    initialIsLiked = false,
    size = "md",
    showCount = true,
}: LikeButtonProps) {
    const { user } = useUser();
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isLoading, setIsLoading] = useState(false);

    const fetchLikeData = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/likes?entityType=${entityType}&entityId=${entityId}`
            );
            if (response.ok) {
                const data = await response.json();
                setLikeCount(data.likeCount);
                setIsLiked(data.isLiked);
            }
        } catch (error) {
            console.error("Error fetching like data:", error);
        }
    }, [entityType, entityId]);

    // Fetch initial like data if not provided
    useEffect(() => {
        if (user && !initialIsLiked && !initialLikeCount) {
            fetchLikeData();
        }
    }, [user, fetchLikeData, initialIsLiked, initialLikeCount]);

    const handleLike = async () => {
        if (!user || isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/likes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entityType,
                    entityId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setIsLiked(data.liked);
                setLikeCount((prev: number) => data.liked ? prev + 1 : prev - 1);
            }
        } catch (error) {
            console.error("Error handling like:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center gap-1 text-gray-400">
                <FiHeart className={`${getSizeClasses(size)}`} />
                {showCount && <span className="text-sm">{likeCount}</span>}
            </div>
        );
    }

    return (
        <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center gap-1 transition-colors ${
                isLiked
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-400 hover:text-red-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <FiHeart
                className={`${getSizeClasses(size)} ${
                    isLiked ? "fill-current" : ""
                }`}
            />
            {showCount && (
                <span className="text-sm font-medium">{likeCount}</span>
            )}
        </button>
    );
}

function getSizeClasses(size: "sm" | "md" | "lg"): string {
    switch (size) {
        case "sm":
            return "w-4 h-4";
        case "md":
            return "w-5 h-5";
        case "lg":
            return "w-6 h-6";
        default:
            return "w-5 h-5";
    }
} 