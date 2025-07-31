"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { FiX, FiEdit3 } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface CompletionNotificationProps {
    entityType: "show" | "season";
    entityId: number;
    entityName: string;
    onReviewClick?: () => void;
    showId?: number;
    seasonNumber?: number;
    episodeId?: number;
    episodeNumber?: number;
}

export default function CompletionNotification({
    entityType,
    entityId,
    entityName,
    onReviewClick,
    showId,
    seasonNumber,
    episodeId,
    episodeNumber,
}: CompletionNotificationProps) {
    const { user } = useUser();
    const router = useRouter();
    const [showNotification, setShowNotification] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const checkCompletion = useCallback(async () => {
        setIsChecking(true);
        try {
            // If we're on an episode page and have episode info, check if this episode completes the season
            if (episodeId && episodeNumber && entityType === "season") {
                // Check if this episode is the last episode of the season
                const response = await fetch(`/api/watched/check-episode-completion`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        episodeId,
                        episodeNumber,
                        seasonId: entityId,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isLastEpisode && data.completesSeason) {
                        setShowNotification(true);
                    }
                }
            } else if (entityType === "season" && showId) {
                // If we're on a season page, check if this season completes the show
                const response = await fetch(`/api/watched/check-season-completion`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        seasonId: entityId,
                        seasonNumber,
                        showId,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isLastSeason && data.completesShow) {
                        setShowNotification(true);
                    }
                }
            } else {
                // Regular completion check for shows
                const response = await fetch(`/api/watched/check-completion`, {
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
                    if (data.isCompleted && data.autoMarked) {
                        setShowNotification(true);
                    }
                }
            }
        } catch (error) {
            console.error("Error checking completion:", error);
        } finally {
            setIsChecking(false);
        }
    }, [entityType, entityId, episodeId, episodeNumber, showId, seasonNumber]);

    const handleReviewClick = () => {
        setShowNotification(false);
        if (onReviewClick) {
            onReviewClick();
        } else {
            // Navigate to the review page
            if (entityType === "season" && showId && seasonNumber) {
                router.push(`/show/${showId}/season/${seasonNumber}`);
            } else if (entityType === "show") {
                router.push(`/show/${entityId}`);
            }
        }
    };

    useEffect(() => {
        if (user) {
            checkCompletion();
        }
    }, [user, checkCompletion]);

    useEffect(() => {
        const handleSeasonCompleted = (event: CustomEvent) => {
            if (entityType === "season" && event.detail.seasonId === entityId) {
                setShowNotification(true);
            }
        };

        const handleShowCompleted = (event: CustomEvent) => {
            if (entityType === "show" && event.detail.showId === entityId) {
                setShowNotification(true);
            }
        };

        window.addEventListener('seasonCompleted', handleSeasonCompleted as EventListener);
        window.addEventListener('showCompleted', handleShowCompleted as EventListener);

        return () => {
            window.removeEventListener('seasonCompleted', handleSeasonCompleted as EventListener);
            window.removeEventListener('showCompleted', handleShowCompleted as EventListener);
        };
    }, [entityType, entityId]);

    if (!showNotification || isChecking) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                        🎉 You&apos;ve finished {entityType === "show" ? "the show" : "the season"}!
                    </h3>
                    <p className="text-sm mb-3">
                        You&apos;ve completed watching &quot;{entityName}&quot;. Would you like to view it?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReviewClick}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white text-green-600 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                            <FiEdit3 className="w-4 h-4" />
                            {entityType === "season" ? "View season" : "View show"}
                        </button>
                        <button
                            onClick={() => setShowNotification(false)}
                            className="px-3 py-1.5 text-sm text-green-100 hover:text-white transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setShowNotification(false)}
                    className="text-green-100 hover:text-white transition-colors ml-2"
                >
                    <FiX className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
} 