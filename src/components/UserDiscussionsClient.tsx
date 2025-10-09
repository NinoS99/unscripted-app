"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GiRose } from "react-icons/gi";
import { FiFilter, FiChevronLeft, FiChevronRight, FiMessageCircle, FiBarChart2 } from "react-icons/fi";

interface Discussion {
  id: number;
  type: 'show' | 'season' | 'episode';
  title: string;
  content: string;
  spoiler: boolean;
  createdAt: Date;
  entityId: number;
  entityName: string;
  posterPath: string | null;
  showId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  likeCount: number;
  commentCount: number;
  hasPoll: boolean;
}

interface UserDiscussionsClientProps {
  username: string;
  isOwnProfile: boolean;
}

type SortOption = "recent" | "popular";
type SpoilerFilter = "all" | "spoiler_free" | "spoiler_only";
type EntityTypeFilter = "all" | "show" | "season" | "episode";

export default function UserDiscussionsClient({ username, isOwnProfile }: UserDiscussionsClientProps) {
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort');
  
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityTypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>(
    sortParam === 'recent' || sortParam === 'popular' ? sortParam : 'recent'
  );
  const [spoilerFilter, setSpoilerFilter] = useState<SpoilerFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState<{ [key: string]: boolean }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [discussionsPerPage, setDiscussionsPerPage] = useState(10);

  const fetchDiscussions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${username}/all-discussions?entityType=${entityTypeFilter}`);
      
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data.discussions || []);
      } else {
        console.error('Failed to fetch discussions');
        setDiscussions([]);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setDiscussions([]);
    } finally {
      setIsLoading(false);
    }
  }, [username, entityTypeFilter]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...discussions];

    // Apply spoiler filter
    if (spoilerFilter === "spoiler_free") {
      filtered = filtered.filter((d) => !d.spoiler);
    } else if (spoilerFilter === "spoiler_only") {
      filtered = filtered.filter((d) => d.spoiler);
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => b.likeCount - a.likeCount);
    }

    setFilteredDiscussions(filtered);
    setCurrentPage(1);
  }, [discussions, sortBy, spoilerFilter]);

  const toggleSpoiler = (key: string) => {
    setShowSpoilers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const truncateContent = (content: string, maxLength: number = 500) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const getDiscussionLink = (discussion: Discussion) => {
    return `/${username}/discussion/${discussion.type}/${discussion.id}`;
  };

  // Pagination
  const indexOfLastDiscussion = currentPage * discussionsPerPage;
  const indexOfFirstDiscussion = indexOfLastDiscussion - discussionsPerPage;
  const currentDiscussions = filteredDiscussions.slice(indexOfFirstDiscussion, indexOfLastDiscussion);
  const totalPages = Math.ceil(filteredDiscussions.length / discussionsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const entityTypeLabels = {
    all: "All",
    show: "Shows",
    season: "Seasons",
    episode: "Episodes",
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-500">
          Discussions by {isOwnProfile ? 'You' : username}
        </h1>
        <p className="text-gray-400 mt-2">
          {discussions.length} discussion{discussions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Entity Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(entityTypeLabels) as EntityTypeFilter[]).map((type) => (
          <button
            key={type}
            onClick={() => setEntityTypeFilter(type)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              entityTypeFilter === type
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {entityTypeLabels[type]}
          </button>
        ))}
      </div>

      {/* Filters and Pagination Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-green-500">
            All {entityTypeFilter !== 'all' ? `${entityTypeFilter.charAt(0).toUpperCase() + entityTypeFilter.slice(1)} ` : ''}Discussions
          </h2>
          <div className="flex items-center gap-4">
            {/* Discussions per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={discussionsPerPage}
                onChange={(e) => {
                  setDiscussionsPerPage(Number(e.target.value));
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
                  <option value="all">All Discussions</option>
                  <option value="spoiler_free">Spoiler Free</option>
                  <option value="spoiler_only">Spoiler Discussions Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discussions List */}
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
      ) : currentDiscussions.length === 0 ? (
        <div className="text-gray-400 text-center py-12">
          No discussions found.
        </div>
      ) : (
        <div className="space-y-0" key={entityTypeFilter}>
            {currentDiscussions.map((discussion, index) => (
              <div key={`${discussion.type}-${discussion.id}`}>
                <Link
                  href={getDiscussionLink(discussion)}
                  className="block hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <div className="flex gap-4 p-4 h-44">
                    {/* Poster */}
                    {discussion.posterPath && (
                      <div className="flex-shrink-0">
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${discussion.posterPath}`}
                          alt={discussion.entityName}
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
                          {discussion.entityName}
                        </h3>

                        {/* Discussion Title */}
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm md:text-md font-medium text-green-400 line-clamp-1">
                            {discussion.title}
                          </h4>
                          {discussion.hasPoll && (
                            <FiBarChart2 className="w-4 h-4 text-blue-400 flex-shrink-0" title="Has poll" />
                          )}
                        </div>

                        {/* Discussion Content */}
                        <div>
                          {discussion.spoiler ? (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-400 text-xs font-medium">
                                  ⚠️ SPOILER
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleSpoiler(`${discussion.type}-${discussion.id}`);
                                  }}
                                  className="text-green-400 hover:text-green-300 text-xs font-medium transition-colors"
                                >
                                  {showSpoilers[`${discussion.type}-${discussion.id}`] ? "Hide" : "Show"}
                                </button>
                              </div>
                              <p
                                className={`text-gray-200 text-sm md:text-md leading-relaxed transition-all duration-300 line-clamp-1 md:line-clamp-1 ${
                                  showSpoilers[`${discussion.type}-${discussion.id}`]
                                    ? "blur-none"
                                    : "blur-sm select-none"
                                }`}
                              >
                                {truncateContent(discussion.content)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-200 text-sm md:text-md leading-relaxed line-clamp-2 md:line-clamp-3">
                              {truncateContent(discussion.content)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Metadata - Desktop */}
                      <div className="hidden md:flex items-center gap-2 text-sm flex-wrap">
                        <p className="text-gray-400">{formatDate(discussion.createdAt)}</p>
                        <span className="text-gray-500">•</span>

                        {/* Likes */}
                        <div className="flex items-center gap-1">
                          <GiRose className="w-4 h-4 text-red-400" />
                          <p className="text-gray-400">{formatCount(discussion.likeCount)}</p>
                        </div>
                        <span className="text-gray-500">•</span>

                        {/* Comments */}
                        <div className="flex items-center gap-1">
                          <FiMessageCircle className="w-4 h-4 text-white-400" />
                          <p className="text-gray-400">{formatCount(discussion.commentCount)}</p>
                        </div>
                      </div>

                      {/* Metadata - Mobile (One row) */}
                      <div className="md:hidden flex items-center gap-2 text-sm flex-wrap">
                        <p className="text-gray-400">{formatDate(discussion.createdAt)}</p>
                        <span className="text-gray-500">•</span>
                        <div className="flex items-center gap-1">
                          <GiRose className="w-4 h-4 text-red-400" />
                          <p className="text-gray-400">{formatCount(discussion.likeCount)}</p>
                        </div>
                        <span className="text-gray-500">•</span>
                        <div className="flex items-center gap-1">
                          <FiMessageCircle className="w-4 h-4 text-white-400" />
                          <p className="text-gray-400">{formatCount(discussion.commentCount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                {index < currentDiscussions.length - 1 && (
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
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            First
          </button>

          {/* Previous Page Button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
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
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page Button */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Last
          </button>
        </div>
      )}

      {/* Page info */}
      {filteredDiscussions.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {indexOfFirstDiscussion + 1}-{Math.min(indexOfLastDiscussion, filteredDiscussions.length)} of {filteredDiscussions.length} discussion{filteredDiscussions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

