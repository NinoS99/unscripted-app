"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiStar, FiMessageSquare, FiList, FiMessageCircle, FiTrendingUp, FiClock, FiChevronDown } from 'react-icons/fi';
import { GiRose } from 'react-icons/gi';

interface UserContentProps {
  userId: string;
  username: string;
}

interface RecentContent {
  reviews: Array<{
    id: string;
    type: 'SHOW' | 'SEASON' | 'EPISODE';
    entityName: string;
    entityId: string;
    rating: number | null;
    content: string;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
    entityPosterPath?: string;
  }>;
  discussions: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
    entityName: string;
    entityId: string;
    entityType: string;
    entityPosterPath?: string;
  }>;
  watchlists: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
    showCount: number;
    posterPaths: string[];
    isRanked: boolean;
  }>;
}

interface PopularContent {
  reviews: Array<{
    id: string;
    type: 'SHOW' | 'SEASON' | 'EPISODE';
    entityName: string;
    entityId: string;
    rating: number | null;
    content: string;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
    entityPosterPath?: string;
  }>;
  discussions: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
    entityName: string;
    entityId: string;
    entityType: string;
    entityPosterPath?: string;
  }>;
  watchlists: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
    showCount: number;
    posterPaths: string[];
    isRanked: boolean;
  }>;
}

export default function UserContent({ userId, username }: UserContentProps) {
  const [recentContent, setRecentContent] = useState<RecentContent | null>(null);
  const [popularContent, setPopularContent] = useState<PopularContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'recent' | 'popular'>('popular');
  const [activeTab, setActiveTab] = useState<'reviews' | 'discussions' | 'watchlists'>('reviews');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // Fetch both recent and popular content in parallel
        const [recentResponse, popularResponse] = await Promise.all([
          fetch(`/api/users/${userId}/recent-content`),
          fetch(`/api/users/${userId}/popular-content`)
        ]);

        const recentData = recentResponse.ok ? await recentResponse.json() : { reviews: [], discussions: [], watchlists: [] };
        const popularData = popularResponse.ok ? await popularResponse.json() : { reviews: [], discussions: [], watchlists: [] };

        setRecentContent(recentData);
        setPopularContent(popularData);
      } catch (error) {
        console.error('Error fetching content:', error);
        setRecentContent({ reviews: [], discussions: [], watchlists: [] });
        setPopularContent({ reviews: [], discussions: [], watchlists: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [userId]);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

  const getCurrentContent = () => {
    return activeMode === 'recent' ? recentContent : popularContent;
  };


  if (loading) {
    return (
      <div>
        {/* Header - matching Activity Feed style */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-green-500">Content</h2>
          {isMobile && (
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label={isCollapsed ? "Expand content" : "Collapse content"}
            >
              <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
            </button>
          )}
        </div>
        <div className="border-b border-gray-600 mb-4"></div>

        {/* Content Area - Show on desktop always, on mobile only when not collapsed */}
        {(!isMobile || !isCollapsed) && (
          <div className={`transition-all duration-300 ease-in-out ${(!isMobile || !isCollapsed) ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            {/* Mode Toggle Skeleton */}
            <div className="flex gap-2 mb-6">
              <div className="h-10 w-24 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-20 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <div className="w-16 h-24 md:w-20 md:h-30 bg-gray-700 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const content = getCurrentContent();

  if (!content) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-green-500">Content</h2>
          {isMobile && (
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label={isCollapsed ? "Expand content" : "Collapse content"}
            >
              <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
            </button>
          )}
        </div>
        <div className="border-b border-gray-600 mb-4"></div>
        {(!isMobile || !isCollapsed) && (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-400">Unable to load content</p>
          </div>
        )}
      </div>
    );
  }

  const tabs = [
    { key: 'reviews' as const, label: 'Reviews', icon: FiStar },
    { key: 'discussions' as const, label: 'Discussions', icon: FiMessageSquare },
    { key: 'watchlists' as const, label: 'Watchlists', icon: FiList },
  ];

  return (
    <div>
      {/* Header - matching Activity Feed style */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-green-500">Content</h2>
        {isMobile && (
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label={isCollapsed ? "Expand content" : "Collapse content"}
          >
            <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        )}
      </div>
      <div className="border-b border-gray-600 mb-4"></div>

      {/* Content Area - Show on desktop always, on mobile only when not collapsed */}
      {(!isMobile || !isCollapsed) && (
        <div className={`transition-all duration-300 ease-in-out ${(!isMobile || !isCollapsed) ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveMode('recent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMode === 'recent'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FiClock className="w-4 h-4" />
              Recent
            </button>
            <button
              onClick={() => setActiveMode('popular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMode === 'popular'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
              Popular
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-0">
            {activeTab === 'reviews' && (
              <>
                {content.reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm mt-2">No reviews yet</p>
                ) : (
                  content.reviews.slice(0, 5).map((review, index) => (
                    <div key={review.id}>
                      <Link
                        href={`/${username}/review/${review.type.toLowerCase()}/${review.id}`}
                        className="block py-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <div className="flex gap-3 h-36 md:h-30">
                          {review.entityPosterPath && (
                            <div className="flex-shrink-0">
                              <Image
                                src={`https://image.tmdb.org/t/p/w500${review.entityPosterPath}`}
                                alt={review.entityName}
                                width={80}
                                height={120}
                                className="w-24 h-36 md:w-20 md:h-30 rounded object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="text-md font-medium text-white hover:text-green-400 transition-colors line-clamp-2">
                                {review.entityName}
                              </h4>
                              <p className="text-sm text-gray-400 line-clamp-3 md:line-clamp-2 mt-1">
                                {review.content}
                              </p>
                            </div>
                            {/* Desktop Layout - All in one row */}
                            <div className="hidden md:flex items-center gap-2 mt-2">
                              {review.rating && (
                                <>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => {
                                      const rating = review.rating!;
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
                                  <span className="text-sm text-gray-500">•</span>
                                </>
                              )}
                              <p className="text-sm text-gray-400">
                                {formatDate(review.createdAt)}
                              </p>
                              <span className="text-sm text-gray-500">•</span>
                              <div className="flex items-center gap-1">
                                <GiRose className="w-4 h-4 text-red-400" />
                                <p className="text-sm text-gray-400">
                                  {formatCount(review.likeCount)}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">•</span>
                              <div className="flex items-center gap-1">
                                <FiMessageCircle className="w-4 h-4 text-white-400" />
                                <p className="text-sm text-gray-400">
                                  {formatCount(review.commentCount)}
                                </p>
                              </div>
                            </div>

                            {/* Mobile Layout - Two rows */}
                            <div className="md:hidden space-y-1">
                              {/* Row 1: Rating + Date */}
                              <div className="flex items-center gap-1">
                                {review.rating && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                                      <span className="text-sm font-semibold text-yellow-400">
                                        {review.rating}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-500">•</span>
                                  </>
                                )}
                                <p className="text-sm text-gray-400">
                                  {formatDate(review.createdAt)}
                                </p>
                              </div>
                              {/* Row 2: Likes + Comments */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <GiRose className="w-4 h-4 text-red-400" />
                                  <p className="text-sm text-gray-400">
                                    {formatCount(review.likeCount)}
                                  </p>
                                </div>
                                <span className="text-sm text-gray-500">•</span>
                                <div className="flex items-center gap-1">
                                  <FiMessageCircle className="w-4 h-4 text-white-400" />
                                  <p className="text-sm text-gray-400">
                                    {formatCount(review.commentCount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                      {index < content.reviews.slice(0, 5).length - 1 && (
                        <div className="border-t border-gray-700 my-3"></div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'discussions' && (
              <>
                {content.discussions.length === 0 ? (
                  <p className="text-gray-400 text-sm mt-2">No discussions yet</p>
                ) : (
                  content.discussions.slice(0, 5).map((discussion, index) => (
                    <div key={discussion.id}>
                      <Link
                        href={`/${username}/discussion/${discussion.entityType}/${discussion.id}`}
                        className="block py-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <div className="flex gap-3 h-36 md:h-30">
                          {discussion.entityPosterPath && (
                            <div className="flex-shrink-0">
                              <Image
                                src={`https://image.tmdb.org/t/p/w500${discussion.entityPosterPath}`}
                                alt={discussion.entityName}
                                width={80}
                                height={120}
                                className="w-24 h-36 md:w-20 md:h-30 rounded object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="text-md font-medium text-white hover:text-green-400 transition-colors line-clamp-1">
                                {discussion.entityName}
                              </h4>
                              <p className="text-sm text-gray-400 line-clamp-1 mt-1">
                                {discussion.title}
                              </p>
                              <p className="text-xs text-gray-400 line-clamp-3 md:line-clamp-2 mt-1">
                                {discussion.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-400">
                                {formatDate(discussion.createdAt)}
                              </p>
                              <span className="text-sm text-gray-500">•</span>
                              <div className="flex items-center gap-1">
                                <GiRose className="w-4 h-4 text-red-400" />
                                <p className="text-sm text-gray-400">
                                  {formatCount(discussion.likeCount)}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">•</span>
                              <div className="flex items-center gap-1">
                                <FiMessageCircle className="w-4 h-4 text-white-400" />
                                <p className="text-sm text-gray-400">
                                  {formatCount(discussion.commentCount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                      {index < content.discussions.slice(0, 5).length - 1 && (
                        <div className="border-t border-gray-700 my-3"></div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'watchlists' && (
              <>
                {content.watchlists.length === 0 ? (
                  <p className="text-gray-400 text-sm mt-2">No watchlists yet</p>
                ) : (
                  content.watchlists.slice(0, 5).map((watchlist, index) => (
                    <div key={watchlist.id}>
                      <Link
                        href={`/${username}/watch-list/${watchlist.id}`}
                        className="block py-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <div className="flex flex-col gap-2">
                          <h4 className="text-md font-medium text-white hover:text-green-400 transition-colors line-clamp-2">
                            {watchlist.name}
                          </h4>
                          {watchlist.description && (
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {watchlist.description}
                            </p>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-400">
                                {formatDate(watchlist.createdAt)}
                              </p>
                              <span className="text-sm text-gray-500">•</span>
                              <p className="text-sm text-gray-400">
                                {watchlist.showCount} show{watchlist.showCount !== 1 ? 's' : ''} in this list
                              </p>
                              {watchlist.isRanked && (
                                <>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-xs text-white px-2 py-1 rounded-full">
                                    Ranked list
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <GiRose className="w-4 h-4 text-red-400" />
                                <p className="text-sm text-gray-400">
                                  {formatCount(watchlist.likeCount)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <FiMessageCircle className="w-4 h-4 text-white-400" />
                                <p className="text-sm text-gray-400">
                                  {formatCount(watchlist.commentCount)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {watchlist.posterPaths.length > 0 && (
                            <div className="flex gap-1.5 mt-2 overflow-hidden">
                              {watchlist.posterPaths.slice(0,4).map((posterPath, posterIndex) => (
                                <div key={posterIndex} className="relative">
                                  <Image
                                    src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                                    alt={`Show ${posterIndex + 1}`}
                                    width={60}
                                    height={90}
                                    className="w-18 h-27 md:w-24 md:h-36 rounded object-cover flex-shrink-0"
                                  />
                                  {posterIndex === 3 && watchlist.posterPaths.length > 4 && (
                                    <div className="absolute inset-0 bg-green-600 bg-opacity-50 rounded flex items-center justify-center">
                                      <span className="text-white text-lg font-bold">+{watchlist.posterPaths.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                      {index < content.watchlists.slice(0, 5).length - 1 && (
                        <div className="border-t border-gray-700 my-3"></div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
