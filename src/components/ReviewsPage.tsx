"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { GiRose } from "react-icons/gi";
import {
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
} from "react-icons/fi";
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

interface ReviewsPageProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
    entityName: string;
    userId?: string | null;
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
            posterPath?: string | null;
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
    // Available image paths for fallback
    availableImages?: {
        episodeStillPath?: string | null;
        seasonPosterPath?: string | null;
        showPosterPath?: string | null;
    };
    // Additional data for charts and stats
    totalLikes?: number;
    totalWatched?: number;
    ratingDistribution?: {
        [key: number]: number;
    };
}

type SortOption = "recent" | "popular" | "highest_rating" | "lowest_rating";
type SpoilerFilter = "all" | "spoiler_free" | "spoiler_only";

export default function ReviewsPage({
    entityType,
    entityId,
    entityName,
    entity,
    availableImages = {},
    totalLikes = 0,
    totalWatched = 0,
    ratingDistribution = {}, // eslint-disable-line @typescript-eslint/no-unused-vars
}: ReviewsPageProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [exactRating, setExactRating] = useState<number | "">("");
    const [spoilerFilter, setSpoilerFilter] = useState<SpoilerFilter>("all");
    const [showFilters, setShowFilters] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [showSpoilers, setShowSpoilers] = useState<{
        [key: number]: boolean;
    }>({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage, setReviewsPerPage] = useState(10);

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
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            fetchReviews();
        }
    }, [fetchReviews, isClient]);

    useEffect(() => {
        let filtered = [...reviews];

        // Apply exact rating filter
        if (exactRating !== "") {
            filtered = filtered.filter(
                (review) => review.userRating === exactRating
            );
        }

        // Apply spoiler filter
        switch (spoilerFilter) {
            case "spoiler_free":
                filtered = filtered.filter((review) => !review.spoiler);
                break;
            case "spoiler_only":
                filtered = filtered.filter((review) => review.spoiler);
                break;
            case "all":
            default:
                // No filtering needed
                break;
        }

        // Apply sorting
        switch (sortBy) {
            case "recent":
                filtered.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
                break;
            case "popular":
                filtered.sort((a, b) => b._count.likes - a._count.likes);
                break;
            case "highest_rating":
                filtered.sort(
                    (a, b) => (b.userRating || 0) - (a.userRating || 0)
                );
                break;
            case "lowest_rating":
                filtered.sort(
                    (a, b) => (a.userRating || 0) - (b.userRating || 0)
                );
                break;
        }

        setFilteredReviews(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [reviews, sortBy, exactRating, spoilerFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const currentReviews = filteredReviews.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const goToFirstPage = () => goToPage(1);
    const goToLastPage = () => goToPage(totalPages);
    const goToPreviousPage = () => goToPage(currentPage - 1);
    const goToNextPage = () => goToPage(currentPage + 1);





    const getEntityLink = () => {
        switch (entityType) {
            case "show":
                return `/show/${entityId}`;
            case "season":
                return `/show/${entity.show?.id || 0}/season/${
                    entity.seasonNumber
                }`;
            case "episode":
                return `/show/${entity.season?.show?.id || 0}/season/${
                    entity.season?.seasonNumber || 0
                }/episode/${entity.episodeNumber || 0}`;
        }
    };

    const getPosterPath = () => {
        switch (entityType) {
            case "show":
                return entity?.posterPath;
            case "season":
                // Priority order: season poster → show poster
                return (
                    availableImages?.seasonPosterPath ||
                    availableImages?.showPosterPath
                );
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

    const truncateContent = (content: string, maxLength: number = 200) => {
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
        />
    );

    if (!isClient || isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-gray-400 text-center py-8">
                        Loading reviews...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-0 md:py-8">
                {/* Mobile Layout */}
                <div className="md:hidden mb-8 -mx-4">
                    {/* Full-width poster with overlay */}
                    <div
                        className="relative w-screen"
                        style={{
                            height: "auto",
                            aspectRatio:
                                entityType === "episode" && entity?.stillPath
                                    ? "16/9"
                                    : "2/3",
                        }}
                    >
                        <Link href={getEntityLink()}>
                            <Image
                                src={
                                    getPosterPath()
                                        ? `https://image.tmdb.org/t/p/w780${getPosterPath()}`
                                        : "/noPoster.jpg"
                                }
                                alt={entityName}
                                width={780}
                                height={
                                    entityType === "episode" &&
                                    entity?.stillPath
                                        ? 439
                                        : 1170
                                }
                                className="w-full h-full object-cover absolute inset-0"
                                priority
                                quality={90}
                            />
                        </Link>

                        {/* Overlay with entity info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-10">
                            <h1 className="text-xl font-bold text-white mb-1">
                                <Link
                                    href={getEntityLink()}
                                    className="hover:text-green-400 transition-colors"
                                >
                                    {entityName}
                                </Link>
                            </h1>
                            {getAirDate() && (
                                <p className="text-sm text-gray-200">
                                    Aired on{" "}
                                    {format(
                                        new Date(getAirDate()!),
                                        "MMMM d, yyyy"
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                                         {/* Mobile info below poster */}
                     <div className="mt-4 space-y-4 px-4">
                         <div className="flex items-center gap-4 text-gray-300">
                             <span>
                                 {reviews.length} review
                                 {reviews.length !== 1 ? "s" : ""}
                             </span>
                         </div>
                         

                         
                         {/* Stats */}
                         <div className="flex flex-col gap-2 text-gray-300 text-sm">
                             <div className="flex items-center gap-1">
                                 <GiRose className="w-4 h-4 text-red-400 fill-current" />
                                 <span>{totalLikes} user{totalLikes !== 1 ? 's' : ''} gave a rose</span>
                             </div>
                             <div className="flex items-center gap-1">
                                 <FiEye className="w-4 h-4 text-green-400" />
                                 <span>{totalWatched} user{totalWatched !== 1 ? 's' : ''} have watched this {entityType}</span>
                             </div>
                         </div>
                     </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex flex-col md:flex-row gap-6 mb-8">
                    {/* Entity Info */}
                    <div className="flex-shrink-0">
                        <Link href={getEntityLink()}>
                            <Image
                                src={
                                    getPosterPath()
                                        ? `https://image.tmdb.org/t/p/w500${getPosterPath()}`
                                        : "/noPoster.jpg"
                                }
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
                                Aired on{" "}
                                {format(
                                    new Date(getAirDate()!),
                                    "MMMM d, yyyy"
                                )}
                            </p>
                        )}
                                                 <div className="mt-2">
                             <div className="flex items-center gap-4 text-gray-300">
                                 <span>
                                     {reviews.length} review
                                     {reviews.length !== 1 ? "s" : ""}
                                 </span>
                             </div>
                             

                             
                             {/* Stats */}
                             <div className="flex flex-col gap-2 text-gray-300 text-sm mt-4">
                                 <div className="flex items-center gap-1">
                                     <GiRose className="w-4 h-4 text-red-400 fill-current" />
                                     <span>{totalLikes} user{totalLikes !== 1 ? 's' : ''} gave a rose</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <FiEye className="w-4 h-4 text-green-400" />
                                     <span>{totalWatched} user{totalWatched !== 1 ? 's' : ''} have watched this {entityType}</span>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Filters and Pagination Controls */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-green-500">
                            All Reviews
                        </h2>
                        <div className="flex items-center gap-4">
                            {/* Reviews per page selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">
                                    Show:
                                </span>
                                <select
                                    value={reviewsPerPage}
                                    onChange={(e) => {
                                        setReviewsPerPage(
                                            Number(e.target.value)
                                        );
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-green-400"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            {/* Filter button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                                <FiFilter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mb-6 space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(
                                                e.target.value as SortOption
                                            )
                                        }
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                                    >
                                        <option value="recent">
                                            Most Recent
                                        </option>
                                        <option value="popular">
                                            Most Popular
                                        </option>
                                        <option value="highest_rating">
                                            Highest Rating
                                        </option>
                                        <option value="lowest_rating">
                                            Lowest Rating
                                        </option>
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Rating Filter
                                    </label>
                                    <select
                                        value={exactRating}
                                        onChange={(e) =>
                                            setExactRating(
                                                e.target.value === ""
                                                    ? ""
                                                    : Number(e.target.value)
                                            )
                                        }
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                                    >
                                        <option value="">All Ratings</option>
                                        {[
                                            0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5,
                                            5,
                                        ].map((rating) => (
                                            <option key={rating} value={rating}>
                                                {rating} stars
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Spoiler Filter
                                    </label>
                                    <select
                                        value={spoilerFilter}
                                        onChange={(e) =>
                                            setSpoilerFilter(
                                                e.target.value as SpoilerFilter
                                            )
                                        }
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                                    >
                                        <option value="all">All Reviews</option>
                                        <option value="spoiler_free">
                                            Spoiler Free
                                        </option>
                                        <option value="spoiler_only">
                                            Spoiler Reviews Only
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reviews List */}
                <div className="space-y-0">
                    {currentReviews.length === 0 ? (
                        <div className="text-gray-400 text-center py-12">
                            {exactRating !== ""
                                ? `No reviews with ${exactRating} star rating.`
                                : "No reviews found."}
                        </div>
                    ) : (
                        currentReviews.map(renderReviewRow)
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {/* First Page Button */}
                        <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            First
                        </button>

                        {/* Previous Page Button */}
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from(
                                { length: Math.min(5, totalPages) },
                                (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                                currentPage === pageNum
                                                    ? "bg-green-600 text-white"
                                                    : "bg-gray-700 text-white hover:bg-gray-600"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        {/* Next Page Button */}
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronRight className="w-4 h-4" />
                        </button>

                        {/* Last Page Button */}
                        <button
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Last
                        </button>
                    </div>
                )}

                {/* Results Info */}
                {filteredReviews.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-400 mb-8">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, filteredReviews.length)} of{" "}
                        {filteredReviews.length} reviews
                    </div>
                )}
            </div>
        </div>
    );
}
