"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { FiHeart, FiMessageCircle, FiStar } from "react-icons/fi";

interface Review {
    id: number;
    content: string;
    createdAt: string;
    userRating?: number;
    userFavorite?: boolean;
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

    const renderReviewCard = (review: Review) => (
        <div key={review.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                    <Image
                        src={review.user.profilePicture?.includes('clerk.com') 
                            ? review.user.profilePicture 
                            : `${review.user.profilePicture || "/noAvatar.png"}?v=${review.user.id}`}
                        alt={review.user.username}
                        width={48}
                        height={48}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link 
                            href={`/${review.user.username}/review/${entityType}/${review.id}`}
                            className="font-semibold text-white hover:text-green-400 transition-colors"
                        >
                            {review.user.username}
                        </Link>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                        {review.userRating && (
                            <div className="flex items-center gap-1 text-yellow-400">
                                <FiStar className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">{review.userRating}</span>
                            </div>
                        )}
                        {review.userFavorite && (
                            <div className="flex items-center gap-1 text-red-400">
                                <FiHeart className="w-4 h-4 fill-current" />
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                    </p>
                </div>
            </div>
            
            <p className="text-gray-200 mb-3 leading-relaxed">
                {truncateContent(review.content)}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                    <FiHeart className="w-4 h-4" />
                    <span>{review._count.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                    <FiMessageCircle className="w-4 h-4" />
                    <span>{review._count.comments}</span>
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
                <div className="text-gray-400 text-center py-8">Loading reviews...</div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
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
                <h2 className="text-2xl font-bold text-white">Reviews</h2>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mostPopular.map(renderReviewCard)}
                    </div>
                </div>
            )}

            {/* Most Recent Reviews */}
            {mostRecent.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Most Recent</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mostRecent.map(renderReviewCard)}
                    </div>
                </div>
            )}
        </div>
    );
} 