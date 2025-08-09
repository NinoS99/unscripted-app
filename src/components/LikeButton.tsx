"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GiRose } from "react-icons/gi";

interface LikeButtonProps {
    entityType: "comment" | "review" | "discussion" | "showReview" | "seasonReview" | "episodeReview" | "watchList";
    entityId: number;
    initialIsLiked?: boolean;
    size?: "sm" | "md" | "lg";
    onLikeChange?: (isLiked: boolean) => void;
}

export default function LikeButton({
    entityType,
    entityId,
    initialIsLiked = false,
    size = "md",
    onLikeChange,
}: LikeButtonProps) {
    const { user } = useUser();
    const pathname = usePathname();
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial like data when user is logged in
    useEffect(() => {
        if (user) {
            const fetchLikeData = async () => {
                try {
                    const response = await fetch(
                        `/api/likes?entityType=${entityType}&entityId=${entityId}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setIsLiked(data.isLiked);
                    }
                } catch (error) {
                    console.error("Error fetching like data:", error);
                }
            };
            fetchLikeData();
        }
    }, [user, entityType, entityId]);

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
                onLikeChange?.(data.liked);
            }
        } catch (error) {
            console.error("Error handling like:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        const getEntityDisplayName = (type: string) => {
            switch (type) {
                case "showReview":
                case "seasonReview":
                case "episodeReview":
                    return "review";
                case "watchList":
                    return "watch list";
                default:
                    return type;
            }
        };

        return (
            <div className="flex items-center gap-1 text-gray-400">
                <p className="text-sm">
                    <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`} className="text-green-400 hover:text-green-300 transition-colors font-medium">
                        Sign in
                    </Link>{" "}
                    to like this {getEntityDisplayName(entityType)}
                </p>
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
            <GiRose
                className={`${getSizeClasses(size)} ${
                    isLiked ? "fill-current" : ""
                }`}
            />
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