"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ReviewRow from "./ReviewRow";

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

export default function EntityReviews({
    entityType,
    entityId,
}: EntityReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSpoilers, setShowSpoilers] = useState<{
        [key: number]: boolean;
    }>({});

    const fetchReviews = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/reviews/${entityType}?${entityType}Id=${entityId}`
            );
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
            .slice(0, 5);
    };

    // Get most recent reviews
    const getMostRecent = () => {
        return [...reviews]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .slice(0, 5);
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + "...";
    };

    const toggleSpoiler = (reviewId: number) => {
        setShowSpoilers((prev) => ({
            ...prev,
            [reviewId]: !prev[reviewId],
        }));
    };

    const renderReviewRow = (review: Review) => (
        <ReviewRow
            key={review.id}
            review={review}
            entityType={entityType}
            showSpoilers={showSpoilers}
            onToggleSpoiler={toggleSpoiler}
            truncateContent={truncateContent}
            className="pt-4 pb-1"
        />
    );

    if (isLoading) {
        return (
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-green-500 mb-4">
                    Reviews
                </h2>
                <div className="text-gray-400 text-center py-8">
                    Loading reviews...
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-green-500 mb-4">
                    Reviews
                </h2>
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
                <h2 className="text-xl font-semibold text-green-500">
                    Reviews
                </h2>
                <Link
                    href={`/reviews/${entityType}/${entityId}`}
                    className="text-green-400 hover:text-green-300 transition-colors font-medium"
                >
                    See all reviews
                </Link>
            </div>

            {/* Most Popular Reviews */}
            {mostPopular.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Most Popular
                    </h3>
                    <div className="border-b border-gray-600"></div>
                    <div className="space-y-0">
                        {mostPopular.map(renderReviewRow)}
                    </div>
                </div>
            )}

            {/* Most Recent Reviews */}
            {mostRecent.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Most Recent
                    </h3>
                    <div className="border-b border-gray-600"></div>
                    <div className="space-y-0">
                        {mostRecent.map(renderReviewRow)}
                    </div>
                </div>
            )}
        </div>
    );
}
