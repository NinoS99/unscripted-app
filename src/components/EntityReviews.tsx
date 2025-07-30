"use client";

import { useState, useEffect, useCallback } from "react";
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
        profilePicture: string | null;
    };
    _count: {
        likes: number;
        comments: number;
    };
}

interface EntityReviewsProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
    entityName: string;
}

export default function EntityReviews({ entityType, entityId }: EntityReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSpoilers, setShowSpoilers] = useState<{ [key: number]: boolean }>({});

    const fetchReviews = useCallback(async () => {
        try {
            const response = await fetch(`/api/reviews/${entityType}?${entityType}Id=${entityId}`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setIsLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Get most popular reviews (by likes)
    const getMostPopular = () => {
        return [...reviews]
            .sort((a, b) => b._count.likes - a._count.likes)
            .slice(0, 3);
    };

    // Get most recent reviews
    const getMostRecent = () => {
        return [...reviews]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + "...";
    };

    const toggleSpoiler = (reviewId: number) => {
        setShowSpoilers(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    const renderReviewRow = (review: Review) => {
        return (
            <div key={review.id} className="py-4 border-b border-gray-700">
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
                    <div className="flex items-center justify-between mb-2">
                        <Link 
                            href={`/${review.user.username}/review/${entityType}/${review.id}`}
                            className="font-semibold text-white hover:text-green-400 transition-colors"
                        >
                            {review.user.username}
                        </Link>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400">
                                {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                            {review.userRating && (
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <FiStar className="w-4 h-4 fill-current" />
                                    <span className="font-medium">{review.userRating}</span>
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
                                    <span className="text-red-400 text-sm font-medium">⚠️ SPOILER</span>
                                    <button
                                        onClick={() => toggleSpoiler(review.id)}
                                        className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                                    >
                                        {showSpoilers[review.id] ? "Hide Spoiler" : "Show Spoiler"}
                                    </button>
                                </div>
                                <p className={`text-gray-200 leading-relaxed transition-all duration-300 ${
                                    showSpoilers[review.id] 
                                        ? "blur-none" 
                                        : "blur-sm select-none"
                                }`}>
                                    {truncateContent(review.content, 200)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-200 leading-relaxed">
                                {truncateContent(review.content, 200)}
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
    };

    if (isLoading) {
        return (
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-green-500 mb-4">Reviews</h2>
                <div className="text-gray-400 text-center py-8">Loading reviews...</div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-green-500 mb-4">Reviews</h2>
                <div className="text-gray-400 text-center py-8">
                    No reviews yet. Be the first to review this {entityType}!
                </div>
            </div>
        );
    }

    const mostPopular = getMostPopular();
    const mostRecent = getMostRecent();

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-green-500">Reviews</h2>
                <Link
                    href={`/reviews/${entityType}/${entityId}`}
                    className="text-green-400 hover:text-green-300 transition-colors font-medium"
                >
                    View All Reviews ({reviews.length})
                </Link>
            </div>

            {/* Most Popular Reviews */}
            {mostPopular.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Most Popular</h3>
                    <div className="border-b border-gray-600 mb-4"></div>
                    <div className="space-y-0">
                        {mostPopular.map(renderReviewRow)}
                    </div>
                </div>
            )}

            {/* Most Recent Reviews */}
            {mostRecent.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Most Recent</h3>
                    <div className="border-b border-gray-600 mb-4"></div>
                    <div className="space-y-0">
                        {mostRecent.map(renderReviewRow)}
                    </div>
                </div>
            )}
        </div>
    );
} 