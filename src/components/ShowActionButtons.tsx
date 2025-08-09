"use client";

import { useState } from "react";
import Link from "next/link";
import RatingComponent from "./RatingComponent";
import FavouriteButton from "./FavouriteButton";
import WatchedButton from "./WatchedButton";
import { FaPenSquare, FaEye } from "react-icons/fa";
import { GiRose } from "react-icons/gi";

interface ShowActionButtonsProps {
    showId: number;
    entityType: "show" | "season" | "episode";
    entityId: number;
    userId: string | null;
    initialTotalWatched: number;
    initialTotalLikes: number;
    initialTotalReviews: number;
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
    showIdForRedirect,
    seasonId,
    episodeId
}: ShowActionButtonsProps) {
    const [totalWatched, setTotalWatched] = useState(initialTotalWatched);
    const [totalLikes, setTotalLikes] = useState(initialTotalLikes);
    const [totalReviews] = useState(initialTotalReviews);

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
                <div className="flex items-center justify-center gap-4 text-gray-300 text-sm">
                    <div className="flex items-center gap-1" title={totalWatched === 0 ? "No users have watched" : totalWatched === 1 ? "Watched by 1 user" : `Watched by ${totalWatched} users`}>
                        <FaEye className="w-4 h-4 text-green-400" />
                        <span>{totalWatched}</span>
                    </div>
                    <div className="flex items-center gap-1" title={totalLikes === 0 ? "No users gave a rose" : totalLikes === 1 ? "1 user gave a rose" : `${totalLikes} users gave a rose`}>
                        <GiRose className="w-4 h-4 text-red-400 fill-current" />
                        <span>{totalLikes}</span>
                    </div>
                    <div className="flex items-center gap-1" title={totalReviews === 0 ? "No users left a review" : totalReviews === 1 ? "1 user left a review" : `${totalReviews} users left a review`}>
                        <FaPenSquare className="w-4 h-4 text-blue-400" />
                        <span>{totalReviews}</span>
                    </div>
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