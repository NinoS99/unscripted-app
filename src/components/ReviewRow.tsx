"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { GiRose } from "react-icons/gi";
import { FiMessageCircle, FiStar } from "react-icons/fi";

interface Review {
    id: number;
    content: string;
    createdAt: string;
    userRating?: number;
    userFavorite?: boolean;
    spoiler: boolean;
    user: {
        id: string;
        username: string;
        profilePicture?: string | null;
    };
    _count: {
        likes: number;
        comments: number;
    };
}

interface ReviewRowProps {
    review: Review;
    entityType: "show" | "season" | "episode";
    showSpoilers: { [key: number]: boolean };
    onToggleSpoiler: (reviewId: number) => void;
    truncateContent: (content: string, maxLength?: number) => string;
    className?: string;
    isLast?: boolean;
}

export default function ReviewRow({
    review,
    entityType,
    showSpoilers,
    onToggleSpoiler,
    truncateContent,
    className = "",
    isLast = false
}: ReviewRowProps) {
    return (
        <div className={`py-4 ${!isLast ? 'border-b border-gray-700' : ''} ${className}`}>
            <div className="flex items-start gap-3 mb-3">
                {/* User Profile Pic */}
                <div className="flex-shrink-0">
                    <Image
                        src={review.user.profilePicture || "/noAvatar.png"}
                        alt={review.user.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                            // Fallback to noAvatar if image fails
                            const target = e.target as HTMLImageElement;
                            target.src = "/noAvatar.png";
                        }}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-grow min-w-0">
                    {/* Top Row: Username and Date/Rating/Favorite */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-2 mb-1 md:mb-0">
                            <span className="text-gray-300">
                                Reviewed by{" "}
                                <Link
                                    href={`/${review.user.username}/review/${entityType}/${review.id}`}
                                    className="font-semibold text-white hover:text-green-400 transition-colors"
                                >
                                    {review.user.username}
                                </Link>
                            </span>
                            <span className="text-gray-400 text-sm">
                                {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            {review.userRating && (
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <FiStar className="w-4 h-4 fill-current" />
                                    <span className="font-medium">
                                        {review.userRating}
                                    </span>
                                </div>
                            )}
                            {review.userFavorite && (
                                <div className="flex items-center gap-1 text-red-400">
                                    <GiRose className="w-4 h-4 fill-current" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Review Content */}
                    <div className="mb-3">
                        {review.spoiler ? (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-400 text-sm font-medium">
                                        ⚠️ SPOILER
                                    </span>
                                    <button
                                        onClick={() => onToggleSpoiler(review.id)}
                                        className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                                    >
                                        {showSpoilers[review.id]
                                            ? "Hide Spoiler"
                                            : "Show Spoiler"}
                                    </button>
                                </div>
                                <p
                                    className={`text-gray-200 leading-relaxed transition-all duration-300 ${
                                        showSpoilers[review.id]
                                            ? "blur-none"
                                            : "blur-sm select-none"
                                    }`}
                                >
                                    {truncateContent(review.content, 300)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-200 leading-relaxed">
                                {truncateContent(review.content, 500)}
                            </p>
                        )}
                    </div>

                    {/* Bottom Row: Likes and Comments */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                            <GiRose className="w-4 h-4" />
                            <span>{review._count.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FiMessageCircle className="w-4 h-4" />
                            <span>{review._count.comments}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 