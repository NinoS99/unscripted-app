"use client";
import { useState, useEffect, useCallback } from 'react';
import { FiStar, FiMessageSquare, FiList, FiTrendingUp, FiEye, FiHeart } from 'react-icons/fi';

interface UserStatsProps {
  userId: string;
}

interface UserStatsData {
  year: number;
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchStats = useCallback(async (year: number) => {
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

  useEffect(() => {
    fetchStats(selectedYear);
  }, [fetchStats, selectedYear]);

  const currentYear = new Date().getFullYear();
  const startYear = stats?.accountCreatedYear || currentYear - 4;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg shadow">
        <p className="text-gray-400">Unable to load stats</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-green-500">Statistics</h3>
      </div>
      <div className="border-b border-gray-600 mb-4"></div>

      {/* Year Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 focus:outline-none focus:border-green-400"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

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
            <FiMessageSquare className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-lg font-semibold text-white">{stats.activityCounts.discussions}</div>
              <div className="text-sm text-gray-400">Discussions</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiList className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-lg font-semibold text-white">{stats.activityCounts.watchlists}</div>
              <div className="text-sm text-gray-400">Watchlists</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
