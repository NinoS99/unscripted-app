"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GiRose } from "react-icons/gi";
import { FiFilter, FiChevronLeft, FiChevronRight, FiStar, FiMessageCircle } from "react-icons/fi";

interface Review {
  id: number;
  type: 'show' | 'season' | 'episode';
  content: string;
  spoiler: boolean;
  createdAt: Date;
  entityId: number;
  entityName: string;
  posterPath: string | null;
  showId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  userRating?: number;
  likeCount: number;
  commentCount: number;
}

interface UserReviewsClientProps {
  username: string;
  isOwnProfile: boolean;
}

type SortOption = "recent" | "popular" | "highest_rating" | "lowest_rating";
type SpoilerFilter = "all" | "spoiler_free" | "spoiler_only";
type EntityTypeFilter = "all" | "show" | "season" | "episode";

export default function UserReviewsClient({ username, isOwnProfile }: UserReviewsClientProps) {
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityTypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>(
    sortParam === 'recent' || sortParam === 'popular' ? sortParam : 'recent'
  );
  const [exactRating, setExactRating] = useState<number | "">("");
  const [spoilerFilter, setSpoilerFilter] = useState<SpoilerFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState<{ [key: string]: boolean }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(10);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${username}/all-reviews?entityType=${entityTypeFilter}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        console.error('Failed to fetch reviews');
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [username, entityTypeFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    let filtered = [...reviews];

    // Apply exact rating filter
    if (exactRating !== "") {
      filtered = filtered.filter((review) => review.userRating === exactRating);
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
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "popular":
        filtered.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "highest_rating":
        filtered.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
        break;
      case "lowest_rating":
        filtered.sort((a, b) => (a.userRating || 0) - (b.userRating || 0));
        break;
    }

    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [reviews, sortBy, exactRating, spoilerFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = filteredReviews.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  const toggleSpoiler = (reviewKey: string) => {
    setShowSpoilers((prev) => ({
      ...prev,
      [reviewKey]: !prev[reviewKey],
    }));
  };

  const truncateContent = (content: string, maxLength: number = 500) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const getReviewLink = (review: Review) => {
    return `/${username}/review/${review.type}/${review.id}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  const entityTypeTabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'show' as const, label: 'Shows' },
    { key: 'season' as const, label: 'Seasons' },
    { key: 'episode' as const, label: 'Episodes' },
  ];

  return (
    <div className="max-w-full mx-auto">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-500">
          Reviews by {isOwnProfile ? 'You' : username}
        </h1>
        <p className="text-gray-400 mt-2">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Entity Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {entityTypeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setEntityTypeFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              entityTypeFilter === tab.key
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters and Pagination Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-green-500">
            All {entityTypeFilter !== 'all' ? `${entityTypeFilter.charAt(0).toUpperCase() + entityTypeFilter.slice(1)} ` : ''}Reviews
          </h2>
          <div className="flex items-center gap-4">
            {/* Reviews per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={reviewsPerPage}
                onChange={(e) => {
                  setReviewsPerPage(Number(e.target.value));
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
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="highest_rating">Highest Rating</option>
                  <option value="lowest_rating">Lowest Rating</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating Filter
                </label>
                <select
                  value={exactRating}
                  onChange={(e) =>
                    setExactRating(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                >
                  <option value="">All Ratings</option>
                  {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
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
                  onChange={(e) => setSpoilerFilter(e.target.value as SpoilerFilter)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-green-400"
                >
                  <option value="all">All Reviews</option>
                  <option value="spoiler_free">Spoiler Free</option>
                  <option value="spoiler_only">Spoiler Reviews Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-gray-800 rounded-lg">
              <div className="w-24 h-36 bg-gray-700 rounded" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : currentReviews.length === 0 ? (
        <div className="text-gray-400 text-center py-12">
          {exactRating !== ""
            ? `No reviews with ${exactRating} star rating.`
            : "No reviews found."}
        </div>
      ) : (
        <div className="space-y-0" key={entityTypeFilter}>
          {currentReviews.map((review, index) => (
            <div key={`${review.type}-${review.id}`}>
              <Link
                href={getReviewLink(review)}
                className="block hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <div className="flex gap-4 p-4 h-44">
                  {/* Poster */}
                  {review.posterPath && (
                    <div className="flex-shrink-0">
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${review.posterPath}`}
                        alt={review.entityName}
                        width={96}
                        height={144}
                        className="w-24 h-36 rounded object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Entity Name */}
                      <h3 className="text-base md:text-lg font-semibold text-white hover:text-green-400 transition-colors mb-2 line-clamp-1">
                        {review.entityName}
                      </h3>

                      {/* Review Content */}
                      <div>
                        {review.spoiler ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-red-400 text-xs font-medium">
                                ⚠️ SPOILER
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleSpoiler(`${review.type}-${review.id}`);
                                }}
                                className="text-green-400 hover:text-green-300 text-xs font-medium transition-colors"
                              >
                                {showSpoilers[`${review.type}-${review.id}`] ? "Hide" : "Show"}
                              </button>
                            </div>
                            <p
                              className={`text-gray-200 text-sm md:text-lg leading-relaxed transition-all duration-300 line-clamp-2 md:line-clamp-3 ${
                                showSpoilers[`${review.type}-${review.id}`]
                                  ? "blur-none"
                                  : "blur-sm select-none"
                              }`}
                            >
                              {truncateContent(review.content)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-200 text-sm md:text-lg leading-relaxed line-clamp-3 md:line-clamp-4">
                            {truncateContent(review.content)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata - Desktop */}
                    <div className="hidden md:flex items-center gap-2 text-sm flex-wrap">
                      {/* Rating */}
                      {review.userRating && (
                        <>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => {
                              const rating = review.userRating!;
                              const isFullStar = i < Math.floor(rating);
                              const isHalfStar = i === Math.floor(rating) && rating % 1 >= 0.5;
                              
                              return (
                                <div key={i} className="relative">
                                  <FiStar className="w-4 h-4 text-gray-600" />
                                  {(isFullStar || isHalfStar) && (
                                    <div 
                                      className="absolute inset-0 overflow-hidden"
                                      style={{ width: isHalfStar ? '50%' : '100%' }}
                                    >
                                      <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-gray-500">•</span>
                        </>
                      )}

                      {/* Date */}
                      <p className="text-gray-400">{formatDate(review.createdAt)}</p>
                      <span className="text-gray-500">•</span>

                      {/* Likes */}
                      <div className="flex items-center gap-1">
                        <GiRose className="w-4 h-4 text-red-400" />
                        <p className="text-gray-400">{formatCount(review.likeCount)}</p>
                      </div>
                      <span className="text-gray-500">•</span>

                      {/* Comments */}
                      <div className="flex items-center gap-1">
                        <FiMessageCircle className="w-4 h-4 text-white-400" />
                        <p className="text-gray-400">{formatCount(review.commentCount)}</p>
                      </div>
                    </div>

                    {/* Metadata - Mobile (Two rows) */}
                    <div className="md:hidden space-y-1">
                      {/* Row 1: Rating + Date */}
                      <div className="flex items-center gap-2 text-sm">
                        {review.userRating && (
                          <>
                            <div className="flex items-center gap-1">
                              <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-semibold text-yellow-400">
                                {review.userRating}
                              </span>
                            </div>
                            <span className="text-gray-500">•</span>
                          </>
                        )}
                        <p className="text-gray-400">{formatDate(review.createdAt)}</p>
                      </div>

                      {/* Row 2: Likes + Comments */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <GiRose className="w-4 h-4 text-red-400" />
                          <p className="text-gray-400">{formatCount(review.likeCount)}</p>
                        </div>
                        <span className="text-gray-500">•</span>
                        <div className="flex items-center gap-1">
                          <FiMessageCircle className="w-4 h-4 text-white-400" />
                          <p className="text-gray-400">{formatCount(review.commentCount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              {index < currentReviews.length - 1 && (
                <div className="border-t border-gray-700"></div>
              )}
            </div>
          ))}
        </div>
      )}

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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
            })}
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

      {/* Page info */}
      {filteredReviews.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredReviews.length)} of {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

