"use client";

import { useState } from "react";
import Link from "next/link";
import RatingComponent from "./RatingComponent";
import FavouriteButton from "./FavouriteButton";
import WatchedButton from "./WatchedButton";
import { FaPenSquare, FaEye, FaMugHot } from "react-icons/fa";
import { GiRose } from "react-icons/gi";
import { FiList } from "react-icons/fi";
import { formatNumber } from "@/lib/utils";

interface ShowActionButtonsProps {
    showId: number;
    entityType: "show" | "season" | "episode";
    entityId: number;
    userId: string | null;
    initialTotalWatched: number;
    initialTotalLikes: number;
    initialTotalReviews: number;
    initialTotalDiscussions: number;
    initialTotalWatchLists?: number; // Only for shows
    showIdForRedirect?: number;
    seasonId?: number;
    episodeId?: number;
}

export default function ShowActionButtons({
    showId,
    entityType,
    entityId,
    userId,
    initialTotalWatched,
    initialTotalLikes,
    initialTotalReviews,
    initialTotalDiscussions,
    initialTotalWatchLists,
    showIdForRedirect,
    seasonId,
    episodeId
}: ShowActionButtonsProps) {
    const [totalWatched, setTotalWatched] = useState(initialTotalWatched);
    const [totalLikes, setTotalLikes] = useState(initialTotalLikes);
    const [totalReviews] = useState(initialTotalReviews);
    const [totalDiscussions] = useState(initialTotalDiscussions);
    const [totalWatchLists] = useState(initialTotalWatchLists || 0);

    const handleFavoriteChange = (isFavorite: boolean) => {
        setTotalLikes(prev => isFavorite ? prev + 1 : prev - 1);
    };

    const handleWatchedChange = (isWatched: boolean) => {
        setTotalWatched(prev => isWatched ? prev + 1 : prev - 1);
    };

    const redirectUrl = showIdForRedirect ? `/show/${showIdForRedirect}` : `/show/${showId}`;

    return (
        <>
            {/* Statistics */}
            <div className="w-full mb-4 px-4 py-2">
                <div className="flex items-center justify-center gap-3 text-gray-300 text-sm">
                    <div className="flex items-center gap-1" title={totalWatched === 0 ? "No users have watched" : totalWatched === 1 ? "Watched by 1 user" : `Watched by ${totalWatched} users`}>
                        <FaEye className="w-4 h-4 text-green-400" />
                        <span>{formatNumber(totalWatched)}</span>
                    </div>
                    <div className="flex items-center gap-1" title={totalLikes === 0 ? "No users gave a rose" : totalLikes === 1 ? "1 user gave a rose" : `${totalLikes} users gave a rose`}>
                        <GiRose className="w-4 h-4 text-red-400 fill-current" />
                        <span>{formatNumber(totalLikes)}</span>
                    </div>
                    <div className="flex items-center gap-1" title={totalReviews === 0 ? "No users left a review" : totalReviews === 1 ? "1 user left a review" : `${totalReviews} users left a review`}>
                        <FaPenSquare className="w-4 h-4 text-blue-400" />
                        <span>{formatNumber(totalReviews)}</span>
                    </div>
                    <div className="flex items-center gap-1" title={totalDiscussions === 0 ? "No discussions made" : totalDiscussions === 1 ? "1 discussion made" : `${totalDiscussions} discussions made`}>
                        <FaMugHot className="w-4 h-4 text-orange-400" />
                        <span>{formatNumber(totalDiscussions)}</span>
                    </div>
                    {entityType === "show" && (
                        <div className="flex items-center gap-1" title={totalWatchLists === 0 ? "Not in any watch lists" : totalWatchLists === 1 ? "In 1 watch list" : `In ${totalWatchLists} watch lists`}>
                            <FiList className="w-4 h-4 text-purple-400" />
                            <span>{formatNumber(totalWatchLists)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons - Same Width as Poster */}
            <div className="w-full space-y-4">
                <div className="rounded-lg shadow pt-4 pb-4 pl-2 pr-2">
                    {userId ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FavouriteButton
                                        entityType={entityType}
                                        entityId={entityId}
                                        onFavoriteChange={handleFavoriteChange}
                                    />
                                    <WatchedButton
                                        entityType={entityType}
                                        entityId={entityId}
                                        showId={showId}
                                        seasonId={seasonId}
                                        episodeId={episodeId}
                                        onWatchedChange={handleWatchedChange}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mr-2">
                                    <RatingComponent
                                        entityType={entityType}
                                        entityId={entityId}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-1">
                            <p className="text-gray-400 text-center text-sm">
                                <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`} className="text-green-400 hover:text-green-300 transition-colors font-medium">
                                    Sign in
                                </Link>{" "}
                                to rate, give a rose, watch, review or discuss this {entityType}!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
} 