"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { FiHeart, FiMessageCircle, FiStar, FiFilter } from "react-icons/fi";

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

interface ReviewsPageProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
    entityName: string;
    entity: {
        id: number;
        name?: string;
        posterPath?: string | null;
        stillPath?: string | null;
        firstAirDate?: Date | null;
        airDate?: Date | null;
        episodeNumber?: number;
        seasonNumber?: number;
        show?: {
            id: number;
            name: string;
        };
        season?: {
            id: number;
            seasonNumber: number;
            show: {
                id: number;
                name: string;
            };
        };
    };
}

type SortOption = "recent" | "popular" | "highest_rating" | "lowest_rating" | "exact_rating";

export default function ReviewsPage({ entityType, entityId, entityName, entity }: ReviewsPageProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [exactRating, setExactRating] = useState<number | "">("");
    const [showFilters, setShowFilters] = useState(false);

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

    useEffect(() => {
        let sorted = [...reviews];

        // Apply exact rating filter first
        if (sortBy === "exact_rating" && exactRating !== "") {
            sorted = sorted.filter(review => review.userRating === exactRating);
        }

        // Apply sorting
        switch (sortBy) {
            case "recent":
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case "popular":
                sorted.sort((a, b) => b._count.likes - a._count.likes);
                break;
            case "highest_rating":
                sorted.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
                break;
            case "lowest_rating":
                sorted.sort((a, b) => (a.userRating || 0) - (b.userRating || 0));
                break;
            case "exact_rating":
                // Already filtered above, just sort by recent
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }

        setFilteredReviews(sorted);
    }, [reviews, sortBy, exactRating]);

    const getEntityLink = () => {
        switch (entityType) {
            case "show":
                return `/show/${entityId}`;
            case "season":
                return `/show/${entity.show?.id || 0}/season/${entity.seasonNumber}`;
            case "episode":
                return `/show/${entity.season?.show?.id || 0}/season/${entity.season?.seasonNumber || 0}/episode/${entity.episodeNumber || 0}`;
        }
    };

    const getPosterPath = () => {
        switch (entityType) {
            case "show":
                return entity?.posterPath;
            case "season":
                return entity?.posterPath;
            case "episode":
                return entity?.stillPath;
        }
    };

    const getAirDate = () => {
        switch (entityType) {
            case "show":
                return entity?.firstAirDate;
            case "season":
                return entity?.airDate;
            case "episode":
                return entity?.airDate;
        }
    };

    const renderReviewCard = (review: Review) => (
        <div key={review.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start gap-4 mb-4">
                <Image
                    src={review.user.profilePicture?.includes('clerk.com') 
                        ? review.user.profilePicture 
                        : `${review.user.profilePicture || "/noAvatar.png"}?v=${review.user.id}`}
                    alt={review.user.username}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link 
                            href={`/${review.user.username}/review/${entityType}/${review.id}`}
                            className="font-semibold text-white hover:text-green-400 transition-colors"
                        >
                            {review.user.username}
                        </Link>
                        <span className="text-sm text-gray-400">
                            {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </span>
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
                </div>
            </div>
            
            <p className="text-gray-200 mb-4 leading-relaxed whitespace-pre-wrap">
                {review.content}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
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
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-gray-400 text-center py-8">Loading reviews...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* Entity Info */}
                    <div className="flex-shrink-0">
                        <Link href={getEntityLink()}>
                            <Image
                                src={getPosterPath() ? `https://image.tmdb.org/t/p/w500${getPosterPath()}` : "/noPoster.jpg"}
                                alt={entityName}
                                width={200}
                                height={300}
                                className="rounded-lg object-cover hover:opacity-80 transition-opacity"
                            />
                        </Link>
                    </div>
                    <div className="flex-grow">
                        <Link 
                            href={getEntityLink()}
                            className="text-2xl md:text-3xl font-bold mb-2 hover:text-green-400 transition-colors"
                        >
                            {entityName}
                        </Link>
                        {getAirDate() && (
                            <p className="text-gray-400">
                                Aired on {format(new Date(getAirDate()!), "MMMM d, yyyy")}
                            </p>
                        )}
                        <p className="text-gray-300 mt-2">
                            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">All Reviews</h2>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                        >
                            <FiFilter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>

                    {showFilters && (
                        <div className="bg-gray-800 rounded-lg p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                                    >
                                        <option value="recent">Most Recent</option>
                                        <option value="popular">Most Popular</option>
                                        <option value="highest_rating">Highest Rating</option>
                                        <option value="lowest_rating">Lowest Rating</option>
                                        <option value="exact_rating">Exact Rating</option>
                                    </select>
                                </div>
                                
                                {sortBy === "exact_rating" && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Rating
                                        </label>
                                        <select
                                            value={exactRating}
                                            onChange={(e) => setExactRating(e.target.value === "" ? "" : Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                                        >
                                            <option value="">Select rating</option>
                                            {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(rating => (
                                                <option key={rating} value={rating}>{rating}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                    {filteredReviews.length === 0 ? (
                        <div className="text-gray-400 text-center py-12">
                            {sortBy === "exact_rating" && exactRating !== "" 
                                ? `No reviews with ${exactRating} star rating.`
                                : "No reviews found."
                            }
                        </div>
                    ) : (
                        filteredReviews.map(renderReviewCard)
                    )}
                </div>
            </div>
        </div>
    );
} 