"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { FiStar, FiList, FiTrendingUp, FiEye, FiHeart, FiChevronDown } from 'react-icons/fi';
import { FaMugHot } from 'react-icons/fa';

interface UserStatsProps {
  userId: string;
}

interface UserStatsData {
  year: number | string;
  watchedCounts: {
    shows: number;
    seasons: number;
    episodes: number;
    total: number;
  };
  ratingCounts: {
    shows: number;
    seasons: number;
    episodes: number;
    total: number;
  };
  averageRatings: {
    shows: number;
    seasons: number;
    episodes: number;
    overall: number;
  };
  reviewCounts: {
    shows: number;
    seasons: number;
    episodes: number;
    total: number;
  };
  activityCounts: {
    discussions: number;
    watchlists: number;
    total: number;
  };
  accountCreatedYear: number;
}

export default function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | string>(new Date().getFullYear());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchStats = useCallback(async (year: number | string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/stats?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  useEffect(() => {
    fetchStatsRef.current(selectedYear);
  }, [selectedYear]);

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

  const currentYear = new Date().getFullYear();
  const startYear = stats?.accountCreatedYear || currentYear - 4;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

  return (
    <div className="">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl md:text-lg font-semibold text-green-500 md:mb-1">Stats</h3>
        {isMobile && (
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label={isCollapsed ? "Expand stats" : "Collapse stats"}
          >
            <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        )}
      </div>
      <div className="border-b border-gray-600 mb-4"></div>

      {/* Year Filter - Always visible when content is shown */}
      {(!isMobile || !isCollapsed) && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              disabled={loading}
              className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 focus:outline-none focus:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">All Time</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Area - maintains consistent height */}
      <div className={`${!isMobile || !isCollapsed ? 'min-h-[600px]' : ''}`}>
        {loading ? (
          <div className="animate-pulse">
            <div className="space-y-6">
              {/* Watched Content Skeleton */}
              <div>
                <div className="h-5 bg-gray-700 rounded mb-3 w-32"></div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="h-8 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-2">
                  <div className="h-6 bg-gray-700 rounded w-20 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                </div>
              </div>

              {/* Ratings Skeleton */}
              <div>
                <div className="h-5 bg-gray-700 rounded mb-3 w-28"></div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="h-8 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-12 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-700 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-2">
                  <div className="h-6 bg-gray-700 rounded w-16 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-28 mx-auto"></div>
                </div>
              </div>

              {/* Reviews Skeleton */}
              <div>
                <div className="h-5 bg-gray-700 rounded mb-3 w-32"></div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="h-8 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-12 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-2">
                  <div className="h-6 bg-gray-700 rounded w-20 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                </div>
              </div>

              {/* Other Activity Skeleton */}
              <div>
                <div className="h-5 bg-gray-700 rounded mb-3 w-28"></div>
                <div className="grid grid-cols-2 gap-4 pb-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gray-700 rounded"></div>
                      <div>
                        <div className="h-5 bg-gray-700 rounded w-8 mb-1"></div>
                        <div className="h-4 bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : !stats ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Unable to load stats</p>
          </div>
        ) : (
          <>
            {/* Content - Show on desktop always, on mobile only when not collapsed */}
            <div className={`transition-all duration-300 ease-in-out ${(!isMobile || !isCollapsed) ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
              {(!isMobile || !isCollapsed) && (
                <>
                {/* Watched Content */}
                <div className="mb-6">
              <h4 className="text-base font-medium text-white mb-3 flex items-center gap-2">
                <FiEye className="w-5 h-5" />
                Watched Content
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.watchedCounts.shows}</div>
                  <div className="text-sm text-gray-400">Shows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.watchedCounts.seasons}</div>
                  <div className="text-sm text-gray-400">Seasons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.watchedCounts.episodes}</div>
                  <div className="text-sm text-gray-400">Episodes</div>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-lg font-semibold text-green-400">{stats.watchedCounts.total}</div>
                <div className="text-xs text-gray-500">Total Items Watched</div>
              </div>
            </div>

            {/* Ratings */}
            <div className="mb-6">
              <h4 className="text-base font-medium text-white mb-3 flex items-center gap-2">
                <FiStar className="w-5 h-5" />
                Ratings Given
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.ratingCounts.shows}</div>
                  <div className="text-sm text-gray-400">Shows</div>
                  <div className="text-xs text-gray-500">
                    Avg: {stats.averageRatings.shows.toFixed(1)}★
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.ratingCounts.seasons}</div>
                  <div className="text-sm text-gray-400">Seasons</div>
                  <div className="text-xs text-gray-500">
                    Avg: {stats.averageRatings.seasons.toFixed(1)}★
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.ratingCounts.episodes}</div>
                  <div className="text-sm text-gray-400">Episodes</div>
                  <div className="text-xs text-gray-500">
                    Avg: {stats.averageRatings.episodes.toFixed(1)}★
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-lg font-semibold text-yellow-400">{stats.averageRatings.overall.toFixed(1)}★</div>
                <div className="text-xs text-gray-500">Overall Average Rating</div>
              </div>
            </div>

            {/* Reviews Written */}
            <div className="mb-6">
              <h4 className="text-base font-medium text-white mb-3 flex items-center gap-2">
                <FiHeart className="w-5 h-5" />
                Reviews Written
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.reviewCounts.shows}</div>
                  <div className="text-sm text-gray-400">Shows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.reviewCounts.seasons}</div>
                  <div className="text-sm text-gray-400">Seasons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.reviewCounts.episodes}</div>
                  <div className="text-sm text-gray-400">Episodes</div>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-lg font-semibold text-green-400">{stats.reviewCounts.total}</div>
                <div className="text-xs text-gray-500">Total Reviews Written</div>
              </div>
            </div>

            {/* Other Activity */}
            <div>
              <h4 className="text-base font-medium text-white mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5" />
                Other Activity
              </h4>
              <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="flex items-center gap-3">
                  <FaMugHot className="w-4 h-4  text-orange-400" />
                  <div>
                    <div className="text-lg font-semibold text-white">{stats.activityCounts.discussions}</div>
                    <div className="text-sm text-gray-400">Discussions</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiList className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-lg font-semibold text-white">{stats.activityCounts.watchlists}</div>
                    <div className="text-sm text-gray-400">Watchlists</div>
                  </div>
                </div>
              </div>
            </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
