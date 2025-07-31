"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FiX, FiCheck } from "react-icons/fi";

interface WatchedButtonProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
    showId?: number;
    seasonId?: number;
    episodeId?: number;
    episodeNumber?: number;
    seasonNumber?: number;
}

interface UnwatchedItem {
    id: number;
    name: string;
    type: "season" | "episode";
    url: string;
}

export default function WatchedButton({
    entityType,
    entityId,
    showId,
    seasonId,
    episodeId,
    episodeNumber,
    seasonNumber,
}: WatchedButtonProps) {
    const { user } = useUser();
    const [isWatched, setIsWatched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [unwatchedItems, setUnwatchedItems] = useState<UnwatchedItem[]>([]);
    const [isConfirming, setIsConfirming] = useState(false);

    const checkWatchedStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/watched/check`, {
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
                setIsWatched(data.isWatched);
            }
        } catch (error) {
            console.error("Error checking watched status:", error);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        if (user) {
            checkWatchedStatus();
        }
    }, [user, checkWatchedStatus]);

    const handleWatchedClick = async () => {
        if (!user) return;

        setIsLoading(true);

        try {
            if (isWatched) {
                // If already watched, unwatch it
                await markAsUnwatched();
            } else {
                // If not watched, check for unwatched items first
                const checkResponse = await fetch(`/api/watched/check-unwatched`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType,
                        entityId,
                        showId,
                        seasonId,
                        episodeId,
                    }),
                });

                if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    
                    if (checkData.hasUnwatchedItems) {
                        setUnwatchedItems(checkData.unwatchedItems);
                        setShowPopup(true);
                        setIsLoading(false);
                        return;
                    }
                }

                // If no unwatched items or user confirms, mark as watched
                await markAsWatched();
            }
        } catch (error) {
            console.error("Error handling watched click:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsWatched = async () => {
        try {
            const response = await fetch(`/api/watched`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entityType,
                    entityId,
                    showId,
                    seasonId,
                    episodeId,
                }),
            });

            if (response.ok) {
                setIsWatched(true);
                setShowPopup(false);
                
                // Check for completion if this is an episode
                if (entityType === "episode" && seasonId) {
                    await checkSeasonCompletion();
                    // Also check if this episode completes the season
                    await checkEpisodeCompletion();
                }
                
                // Check for completion if this is a season
                if (entityType === "season" && showId) {
                    await checkShowCompletion();
                    // Also check if this season completes the show
                    await checkSeasonCompletionForShow();
                }
            }
        } catch (error) {
            console.error("Error marking as watched:", error);
        }
    };

    const checkSeasonCompletion = async () => {
        try {
            const response = await fetch(`/api/watched/check-completion`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entityType: "season",
                    entityId: seasonId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.isCompleted && data.autoMarked) {
                    // Show completion notification
                    const event = new CustomEvent('seasonCompleted', {
                        detail: { seasonId, showId }
                    });
                    window.dispatchEvent(event);
                }
            }
        } catch (error) {
            console.error("Error checking season completion:", error);
        }
    };

    const checkShowCompletion = async () => {
        try {
            const response = await fetch(`/api/watched/check-completion`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entityType: "show",
                    entityId: showId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.isCompleted && data.autoMarked) {
                    // Show completion notification
                    const event = new CustomEvent('showCompleted', {
                        detail: { showId }
                    });
                    window.dispatchEvent(event);
                }
            }
        } catch (error) {
            console.error("Error checking show completion:", error);
        }
    };

    const checkEpisodeCompletion = async () => {
        try {
            const response = await fetch(`/api/watched/check-episode-completion`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    episodeId: entityId,
                    episodeNumber: episodeNumber,
                    seasonId: seasonId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.isLastEpisode && data.completesSeason) {
                    // Show completion notification for season
                    const event = new CustomEvent('seasonCompleted', {
                        detail: { seasonId, showId }
                    });
                    window.dispatchEvent(event);
                }
            }
        } catch (error) {
            console.error("Error checking episode completion:", error);
        }
    };

    const checkSeasonCompletionForShow = async () => {
        try {
            const response = await fetch(`/api/watched/check-season-completion`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seasonId: entityId,
                    seasonNumber: seasonNumber,
                    showId: showId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.isLastSeason && data.completesShow) {
                    // Show completion notification for show
                    const event = new CustomEvent('showCompleted', {
                        detail: { showId }
                    });
                    window.dispatchEvent(event);
                }
            }
        } catch (error) {
            console.error("Error checking season completion for show:", error);
        }
    };

    const markAsUnwatched = async () => {
        try {
            const response = await fetch(`/api/watched`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entityType,
                    entityId,
                }),
            });

            if (response.ok) {
                setIsWatched(false);
            }
        } catch (error) {
            console.error("Error marking as unwatched:", error);
        }
    };

    const handleConfirmWatched = async () => {
        setIsConfirming(true);
        await markAsWatched();
        setIsConfirming(false);
    };

    const handleUnwatchedItemClick = (item: UnwatchedItem) => {
        window.open(item.url, "_blank");
    };

    if (!user) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="p-2 rounded-full bg-white shadow animate-pulse">
                <div className="w-5 h-5"></div>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={handleWatchedClick}
                disabled={isLoading}
                className={`p-2 rounded-full shadow hover:bg-gray-100 transition-colors bg-green-200`}
                aria-label={isWatched ? "Mark as unwatched" : "Mark as watched"}
                title={isWatched ? "Mark as unwatched" : "Mark as watched"}
            >
                {isWatched ? (
                    <FiEye className="text-black text-xl" />
                ) : (
                    <FiEyeOff className="text-black text-xl" />
                )}
            </button>

            {/* Popup Modal */}
            {showPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">
                                Confirm Watched Status
                            </h3>
                            <button
                                onClick={() => setShowPopup(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-gray-300 mb-4">
                                Have you watched all episodes of this {entityType}? 
                                {unwatchedItems.length > 0 && (
                                    <span className="block mt-2 text-sm text-gray-400">
                                        The following items are not marked as watched:
                                    </span>
                                )}
                            </p>

                            {unwatchedItems.length > 0 && (
                                <div className="max-h-48 overflow-y-auto mb-4">
                                    {unwatchedItems.map((item) => (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            onClick={() => handleUnwatchedItemClick(item)}
                                            className="flex items-center justify-between p-2 bg-gray-700 rounded mb-2 cursor-pointer hover:bg-gray-600 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <span className="text-sm text-white font-medium">
                                                    {item.name}
                                                </span>
                                                <span className="block text-xs text-gray-400 capitalize">
                                                    {item.type}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                Click to view
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-sm text-gray-400 mb-4">
                                {unwatchedItems.length > 0 
                                    ? "All episodes will be set to watched if you confirm."
                                    : "This will mark the entire show as watched."
                                }
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t border-gray-700">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmWatched}
                                disabled={isConfirming}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isConfirming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Confirming...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-4 h-4" />
                                        Confirm
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 