"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiStar, FiMessageSquare, FiList } from 'react-icons/fi';

interface UserRecentContentProps {
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
    entityPosterPath?: string;
  }>;
  discussions: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
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
    showCount: number;
    posterPaths: string[];
  }>;
}

export default function UserRecentContent({ userId, username }: UserRecentContentProps) {
  const [content, setContent] = useState<RecentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'discussions' | 'watchlists'>('reviews');

  useEffect(() => {
    const fetchRecentContent = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/recent-content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        } else {
          // Fallback to empty content if API fails
          setContent({
            reviews: [],
            discussions: [],
            watchlists: []
          });
        }
      } catch (error) {
        console.error('Error fetching recent content:', error);
        // Fallback to empty content on error
        setContent({
          reviews: [],
          discussions: [],
          watchlists: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecentContent();
  }, [userId]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEntityLink = (type: string, entityId: string, entityType?: string, reviewId?: string, discussionId?: string) => {
    switch (type) {
      case 'SHOW':
        return `/${username}/review/show/${reviewId || entityId}`;
      case 'SEASON':
        return `/${username}/review/season/${reviewId || entityId}`;
      case 'EPISODE':
        return `/${username}/review/episode/${reviewId || entityId}`;
      case 'discussion':
        return `/${username}/discussion/${entityType}/${discussionId || entityId}`;
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-lg shadow">
        <p className="text-gray-400">Unable to load recent content</p>
      </div>
    );
  }

  const tabs = [
    { key: 'reviews' as const, label: 'Reviews', icon: FiStar, count: content.reviews.length },
    { key: 'discussions' as const, label: 'Discussions', icon: FiMessageSquare, count: content.discussions.length },
    { key: 'watchlists' as const, label: 'Watchlists', icon: FiList, count: content.watchlists.length },
  ];

  return (
    <div className="rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-green-500">Recent Content</h3>
      </div>
      <div className="border-b border-gray-600 mb-4"></div>

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
            <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
              {tab.count}
            </span>
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
                    href={getEntityLink(review.type, review.entityId, undefined, review.id)}
                    className="block py-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                  >
                    <div className="flex gap-3">
                      {/* Poster Image */}
                      {review.entityPosterPath && (
                        <div className="w-12 h-18 flex-shrink-0">
                          <Image
                            src={`https://image.tmdb.org/t/p/w154${review.entityPosterPath}`}
                            alt={review.entityName}
                            width={48}
                            height={72}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-medium text-white hover:text-green-400 transition-colors line-clamp-2">
                          {review.entityName}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {review.content}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">
                            {formatDate(review.createdAt)}
                          </p>
                          {review.rating && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <FiStar
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating! ? 'text-yellow-400 fill-current' : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
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
                    href={getEntityLink('discussion', discussion.entityId, discussion.entityType, undefined, discussion.id)}
                    className="block py-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                  >
                    <div className="flex gap-3">
                      {/* Poster Image */}
                      {discussion.entityPosterPath && (
                        <div className="w-12 h-18 flex-shrink-0">
                          <Image
                            src={`https://image.tmdb.org/t/p/w154${discussion.entityPosterPath}`}
                            alt={discussion.entityName}
                            width={48}
                            height={72}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-medium text-white hover:text-green-400 transition-colors line-clamp-2">
                          {discussion.title}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {discussion.content}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(discussion.createdAt)}
                        </p>
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
                      <h4 className="text-sm font-medium text-white hover:text-green-400 transition-colors line-clamp-2">
                        {watchlist.name}
                      </h4>
                      {watchlist.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {watchlist.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {watchlist.showCount} show{watchlist.showCount !== 1 ? 's' : ''} in this list
                      </p>
                      {/* Show Posters */}
                      {watchlist.posterPaths.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {watchlist.posterPaths.slice(0, 4).map((posterPath, idx) => (
                            <Image
                              key={idx}
                              src={`https://image.tmdb.org/t/p/w154${posterPath}`}
                              alt="Show poster"
                              width={40}
                              height={60}
                              className="w-10 h-15 rounded object-cover"
                            />
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
  );
}
