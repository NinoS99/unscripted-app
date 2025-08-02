"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FiX, FiCheck } from "react-icons/fi";
import ErrorNotification from "./ErrorNotification";

interface WatchedButtonProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
    showId?: number;
    seasonId?: number;
    episodeId?: number;
}

interface UnwatchedItem {
    id: number;
    name: string;
    type: "season" | "episode";
    url: string;
    seasonId?: number;
}

interface UnwatchConfirmationData {
    entityType: "episode";
    episodeName: string;
    seasonName: string;
    showName: string;
    episodeId: number;
    seasonId: number;
    showId: number;
    seasonWatched: boolean;
    showWatched: boolean;
}

export default function WatchedButton({
    entityType,
    entityId,
    showId,
    seasonId,
    episodeId,
}: WatchedButtonProps) {
    const { user } = useUser();
    const [isWatched, setIsWatched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [unwatchedItems, setUnwatchedItems] = useState<UnwatchedItem[]>([]);
    const [isConfirming, setIsConfirming] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showError, setShowError] = useState(false);
    const [showUnwatchConfirmation, setShowUnwatchConfirmation] = useState(false);
    const [unwatchConfirmationData, setUnwatchConfirmationData] = useState<UnwatchConfirmationData | null>(null);
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());

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
                // If already watched, check if we can unwatch it
                const canUnwatchResponse = await fetch(`/api/watched/check-can-unwatch`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType,
                        entityId,
                    }),
                });

                if (canUnwatchResponse.ok) {
                    const canUnwatchData = await canUnwatchResponse.json();
                    
                    if (!canUnwatchData.canUnwatch) {
                        setErrorMessage(canUnwatchData.message);
                        setShowError(true);
                        setIsLoading(false);
                        return;
                    }
                }

                // If this is an episode, show confirmation dialog
                if (entityType === "episode" && seasonId && showId) {
                    // Get episode details and check watched status
                    const [episodeDetailsResponse, seasonWatchedResponse, showWatchedResponse] = await Promise.all([
                        fetch(`/api/shows/${showId}/episodes/${entityId}`),
                        fetch(`/api/watched/check`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ entityType: "season", entityId: seasonId })
                        }),
                        fetch(`/api/watched/check`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ entityType: "show", entityId: showId })
                        })
                    ]);

                    if (episodeDetailsResponse.ok && seasonWatchedResponse.ok && showWatchedResponse.ok) {
                        const episodeDetails = await episodeDetailsResponse.json();
                        const seasonWatchedData = await seasonWatchedResponse.json();
                        const showWatchedData = await showWatchedResponse.json();

                        // Only show confirmation if season or show will be unwatched
                        if (seasonWatchedData.isWatched || showWatchedData.isWatched) {
                            setUnwatchConfirmationData({
                                entityType: "episode",
                                episodeName: episodeDetails.name,
                                seasonName: episodeDetails.season.seasonNumber === 0 ? "Specials" : `Season ${episodeDetails.season.seasonNumber}`,
                                showName: episodeDetails.season.show.name,
                                episodeId: entityId,
                                seasonId: seasonId,
                                showId: showId,
                                seasonWatched: seasonWatchedData.isWatched,
                                showWatched: showWatchedData.isWatched
                            });
                            setShowUnwatchConfirmation(true);
                            setIsLoading(false);
                            return;
                        }
                    }
                }

                // If we can unwatch, proceed
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
            let response;
            
            // For episodes, use the special endpoint that handles auto-completion
            if (entityType === "episode" && seasonId && showId) {
                response = await fetch(`/api/watched/mark-episode-watched`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        episodeId: entityId,
                        seasonId,
                        showId,
                    }),
                });
            } else if (entityType === "season" && showId) {
                // For seasons, use the special endpoint that handles auto-completion
                response = await fetch(`/api/watched/mark-season-watched`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        seasonId: entityId,
                        showId,
                    }),
                });
            } else {
                // For shows, use the regular endpoint
                response = await fetch(`/api/watched`, {
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
            }

            if (response.ok) {
                const data = await response.json();
                setIsWatched(true);
                setShowPopup(false);
                
                // Show completion notification if auto-completed
                if (data.autoCompleted) {
                    if (data.autoCompleted.show) {
                        // Show show completion notification (takes precedence)
                        const event = new CustomEvent('showCompleted', {
                            detail: { showId }
                        });
                        window.dispatchEvent(event);
                    } else if (data.autoCompleted.season) {
                        // Show season completion notification (only if show wasn't completed)
                        const event = new CustomEvent('seasonCompleted', {
                            detail: { seasonId, showId }
                        });
                        window.dispatchEvent(event);
                    }
                }
            }
        } catch (error) {
            console.error("Error marking as watched:", error);
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

    const handleUnwatchConfirmation = async () => {
        if (!unwatchConfirmationData) return;
        
        setIsConfirming(true);
        try {
            // Unwatch the episode, season, and show
            const response = await fetch(`/api/watched/unwatch-episode-cascade`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    episodeId: unwatchConfirmationData.episodeId,
                    seasonId: unwatchConfirmationData.seasonId,
                    showId: unwatchConfirmationData.showId,
                }),
            });

            if (response.ok) {
                setIsWatched(false);
                setShowUnwatchConfirmation(false);
                setUnwatchConfirmationData(null);
            }
        } catch (error) {
            console.error("Error unwatching episode cascade:", error);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleUnwatchCancel = () => {
        setShowUnwatchConfirmation(false);
        setUnwatchConfirmationData(null);
    };

    const handleConfirmWatched = async () => {
        setIsConfirming(true);
        await markAsWatched();
        setIsConfirming(false);
    };

    const handleUnwatchedItemClick = (item: UnwatchedItem) => {
        window.open(item.url, "_blank");
    };

    const toggleSeasonExpansion = (seasonId: number) => {
        setExpandedSeasons(prev => {
            const newSet = new Set(prev);
            if (newSet.has(seasonId)) {
                newSet.delete(seasonId);
            } else {
                newSet.add(seasonId);
            }
            return newSet;
        });
    };

    const getSeasonEpisodes = (seasonId: number) => {
        return unwatchedItems.filter(item => 
            item.type === 'episode' && 
            item.seasonId === seasonId
        );
    };

    const getSeasonItems = () => {
        const seasons = unwatchedItems.filter(item => item.type === 'season');
        
        // If we're viewing a season page and there are no seasons but there are episodes,
        // create a virtual season item for the current season
        if (seasons.length === 0 && entityType === 'season' && unwatchedItems.some(item => item.type === 'episode')) {
            const episodes = unwatchedItems.filter(item => item.type === 'episode');
            if (episodes.length > 0) {
                // Create a virtual season using the first episode's seasonId
                const virtualSeason = {
                    id: episodes[0].seasonId!,
                    name: entityId === 0 ? "Specials" : `Season ${entityId}`,
                    type: 'season' as const,
                    url: `/show/${showId}/season/${entityId}`,
                    episodes: episodes
                };
                return [virtualSeason];
            }
        }
        
        return seasons.map(season => ({
            ...season,
            episodes: getSeasonEpisodes(season.id)
        }));
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

            <ErrorNotification
                message={errorMessage}
                isVisible={showError}
                onClose={() => setShowError(false)}
                duration={5000}
            />

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
                                    {/* If we're viewing a season page, show episodes directly */}
                                    {entityType === 'season' && unwatchedItems.every(item => item.type === 'episode') ? (
                                        unwatchedItems.map((episode) => (
                                            <div
                                                key={`episode-${episode.id}`}
                                                onClick={() => handleUnwatchedItemClick(episode)}
                                                className="flex items-center justify-between p-2 bg-gray-700 rounded mb-2 cursor-pointer hover:bg-gray-600 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <span className="text-sm text-white font-medium">
                                                        {episode.name}
                                                    </span>
                                                    <span className="block text-xs text-gray-400 capitalize">
                                                        episode
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    Click to view
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        /* Show seasons with collapsible episodes */
                                        getSeasonItems().map((season) => (
                                            <div key={`season-${season.id}`}>
                                                {/* Season Item */}
                                                <div className="flex items-center justify-between p-2 bg-gray-700 rounded mb-2">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleSeasonExpansion(season.id)}
                                                            className="text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            {expandedSeasons.has(season.id) ? '▼' : '▶'}
                                                        </button>
                                                        <span className="text-sm text-white font-medium">
                                                            {season.name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            ({season.episodes.length} episodes)
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnwatchedItemClick(season)}
                                                        className="text-xs text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        View season
                                                    </button>
                                                </div>
                                                
                                                {/* Episodes (only if expanded) */}
                                                {expandedSeasons.has(season.id) && season.episodes.map((episode) => (
                                                    <div
                                                        key={`episode-${episode.id}`}
                                                        onClick={() => handleUnwatchedItemClick(episode)}
                                                        className="flex items-center justify-between p-2 bg-gray-700 rounded mb-2 cursor-pointer hover:bg-gray-600 transition-colors ml-4"
                                                    >
                                                        <div className="flex-1">
                                                            <span className="text-sm text-white font-medium">
                                                                <span className="text-gray-500 mr-2">└─</span>
                                                                {episode.name}
                                                            </span>
                                                            <span className="block text-xs text-gray-400 capitalize">
                                                                episode
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            Click to view
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    )}
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

            {/* Unwatch Confirmation Modal */}
            {showUnwatchConfirmation && unwatchConfirmationData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">
                                Confirm Unwatch Action
                            </h3>
                            <button
                                onClick={handleUnwatchCancel}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-gray-300 mb-4">
                                Unwatching &quot;{unwatchConfirmationData.episodeName}&quot; will also unwatch:
                            </p>
                            
                            <div className="space-y-2 mb-4">
                                {unwatchConfirmationData.showWatched && (
                                    <div className="p-2 bg-gray-700 rounded">
                                        <div className="flex items-center gap-2">
                                            <FiEyeOff className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-white font-medium">
                                                {unwatchConfirmationData.showName}
                                            </span>
                                        </div>
                                        {unwatchConfirmationData.seasonWatched && (
                                            <div className="ml-6 mt-2 flex items-center gap-2">
                                                <span className="text-gray-500 text-sm">└─</span>
                                                <span className="text-sm text-gray-300">
                                                    {unwatchConfirmationData.seasonName}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {unwatchConfirmationData.seasonWatched && !unwatchConfirmationData.showWatched && (
                                    <div className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                                        <FiEyeOff className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-white">
                                            {unwatchConfirmationData.seasonName}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-gray-400">
                                {unwatchConfirmationData.seasonWatched || unwatchConfirmationData.showWatched 
                                    ? "This is because the episode is part of the season and show. You can re-watch them individually later."
                                    : "This will only unwatch the episode."
                                }
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t border-gray-700">
                            <button
                                onClick={handleUnwatchCancel}
                                className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnwatchConfirmation}
                                disabled={isConfirming}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isConfirming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Unwatching...
                                    </>
                                ) : (
                                    <>
                                        <FiEyeOff className="w-4 h-4" />
                                        Unwatch All
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