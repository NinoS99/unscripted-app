"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { FiClock, FiTrendingUp } from "react-icons/fi";
import ReviewRow from "./ReviewRow";
import { formatNumber } from "@/lib/utils";

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
    const { user } = useUser();
    const pathname = usePathname();
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

    const renderReviewRow = (review: Review, index: number, array: Review[]) => (
        <ReviewRow
            key={review.id}
            review={review}
            entityType={entityType}
            showSpoilers={showSpoilers}
            onToggleSpoiler={toggleSpoiler}
            truncateContent={truncateContent}
            className="pt-4 pb-1"
            isLast={index === array.length - 1}
        />
    );

    if (isLoading) {
        return (
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-green-500 mb-4">
                    Reviews ({formatNumber(reviews.length)})
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
                    Reviews ({formatNumber(reviews.length)})
                </h2>
                <div className="border-b border-gray-600 mb-2 md:mb-4"></div>
                <div className="text-gray-400 text-center mb-8">
                    {user ? (
                        `No reviews yet. Be the first to review this ${entityType}!`
                    ) : (
                        <>
                            No reviews yet.{" "}
                            <Link 
                                href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`}
                                className="text-green-400 hover:text-green-300 transition-colors font-medium"
                            >
                                Log in
                            </Link>{" "}
                            to be the first to review this {entityType}!
                        </>
                    )}
                </div>
            </div>
        );
    }

    const mostPopular = getMostPopular();
    const mostRecent = getMostRecent();

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-green-500">
                    Reviews ({formatNumber(reviews.length)})
                </h2>
                <Link
                    href={`/reviews/${entityType}/${entityId}`}
                    className="text-green-400 hover:text-green-300 transition-colors font-medium"
                >
                    <span className="md:hidden text-sm">See all</span>
                    <span className="hidden md:inline">See all reviews</span>
                </Link>
            </div>
            <div className="border-b border-gray-600 mb-4"></div>

            {/* Most Popular Reviews */}
            {mostPopular.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2 md:mb-4">
                        <FiTrendingUp className="w-5 h-5 text-green-400" />
                        <h3 className="text-base md:text-lg font-semibold text-white">
                            Popular
                        </h3>
                    </div>
                    <div className="space-y-0">
                        {mostPopular.map(renderReviewRow)}
                    </div>
                </div>
            )}

            {/* Most Recent Reviews */}
            {mostRecent.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2 md:mb-4">
                        <FiClock className="w-5 h-5 text-green-400" />
                        <h3 className="text-base md:text-lg font-semibold text-white">
                            Recent
                        </h3>
                    </div>
                    <div className="space-y-0">
                        {mostRecent.map(renderReviewRow)}
                    </div>
                </div>
            )}
        </div>
    );
}
