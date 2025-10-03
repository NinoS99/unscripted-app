"use client";
import { useState, useEffect, useCallback } from 'react';
import { FiEyeOff, FiFilter, FiMessageCircle, FiThumbsUp, FiThumbsDown, FiList } from 'react-icons/fi';
import { FaPenSquare, FaStar } from 'react-icons/fa';
import { FaMugHot } from 'react-icons/fa';
import { GiRose } from 'react-icons/gi';
import { ActivityType, ActivityGroup } from '@prisma/client';
import { StandardizedMetadata } from '@/lib/activityTracker';

interface UserActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
}

interface ActivityItem {
  id: string;
  activityType: ActivityType;
  description: string;
  createdAt: Date;
  isPublic: boolean;
  points: number;
  entityType?: string;
  entityId?: number;
  giverId?: string;
  giver?: {
    username: string;
  };
  user?: {
    username: string;
  };
  metadata?: StandardizedMetadata;
}

interface ActivityFilters {
  activityTypes: ActivityType[];
  activityGroups: ActivityGroup[];
  year?: number;
  month?: number;
  day?: number;
  startDate?: string;
  endDate?: string;
}

export default function UserActivityFeed({ userId, isOwnProfile }: UserActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterMode, setFilterMode] = useState<'you' | 'incoming'>('you');
  const [filters, setFilters] = useState<ActivityFilters>({
    activityTypes: [],
    activityGroups: [],
  });
  const [hasInitializedFilters, setHasInitializedFilters] = useState(false);
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [dateError, setDateError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const loadActivities = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      // Use 10 activities per page on mobile, 20 on desktop
      const limit = isMobile ? 10 : 20;
      const offset = (page - 1) * limit;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        filterMode,
        ...(filters.activityTypes.length > 0 && { 
          activityTypes: filters.activityTypes.join(',') 
        }),
        ...(filters.activityGroups.length > 0 && { 
          activityGroups: filters.activityGroups.join(',') 
        }),
        ...(filters.year && { year: filters.year.toString() }),
        ...(filters.month && { month: filters.month.toString() }),
        ...(filters.day && { day: filters.day.toString() }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/users/${userId}/activities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setCurrentPage(page);
        
        // Calculate total pages (max 10 pages)
        const totalItems = data.totalCount || 0;
        let maxPages = 1;
        
        if (totalItems > 0) {
          maxPages = Math.min(10, Math.ceil(totalItems / limit));
        } else if (data.activities.length === limit) {
          // If we got a full page and no total count, assume there might be more
          maxPages = Math.min(10, page + 1);
        }
        
        setTotalPages(maxPages);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filters, filterMode, isMobile]);

  // Detect screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for screen size changes
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadActivities(1);
  }, [filters, filterMode, loadActivities]);

  const scrollToActivityFeed = () => {
    // Find the activity feed header and scroll to it
    const activityFeedHeader = document.querySelector('[data-activity-feed-header]');
    if (activityFeedHeader) {
      console.log('Scrolling to activity feed header');
      
      // Get the header position and scroll to it with an offset
      const headerTop = (activityFeedHeader as HTMLElement).offsetTop;
      const scrollPosition = isMobile ? headerTop - 100 : headerTop + 300;
      
      window.scrollTo({
        top: Math.max(0, scrollPosition), // Don't scroll above the top
        behavior: 'smooth'
      });
    } else {
      console.log('Activity feed header not found');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadActivities(page);
      // Scroll to top after a delay to allow loading to complete
      setTimeout(scrollToActivityFeed, 300);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Initialize filters with all groups selected when filter panel opens for the first time
  useEffect(() => {
    if (showFilters && !hasInitializedFilters) {
      const allGroups = Object.values(ActivityGroup).filter(group => {
        // For incoming mode on own profile, exclude CONTENT_CREATION
        if (isOwnProfile && filterMode === 'incoming' && group === 'CONTENT_CREATION') {
          return false;
        }
        return true;
      });
      
      setFilters(prev => ({
        ...prev,
        activityGroups: allGroups
      }));
      setHasInitializedFilters(true);
    }
  }, [showFilters, hasInitializedFilters, isOwnProfile, filterMode]);

  const handleSelectAllGroups = () => {
    const allGroups = Object.values(ActivityGroup).filter(group => {
      if (isOwnProfile && filterMode === 'incoming' && group === 'CONTENT_CREATION') {
        return false;
      }
      return true;
    });
    setFilters(prev => ({
      ...prev,
      activityGroups: allGroups
    }));
  };

  const handleApplyDateFilter = () => {
    // Validate date range
    if (dateFilters.startDate && dateFilters.endDate) {
      const startDate = new Date(dateFilters.startDate);
      const endDate = new Date(dateFilters.endDate);
      
      if (startDate > endDate) {
        setDateError('Start date cannot be after end date');
        return;
      }
    }
    
    setDateError('');
    setFilters(prev => ({
      ...prev,
      startDate: dateFilters.startDate || undefined,
      endDate: dateFilters.endDate || undefined
    }));
  };

  const handleRemoveDateFilter = () => {
    setDateFilters({
      startDate: '',
      endDate: ''
    });
    setDateError('');
    setFilters(prev => ({
      ...prev,
      startDate: undefined,
      endDate: undefined
    }));
  };

  const formatActivityTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getActivityIcon = (activity: ActivityItem) => {
    const { entityType, activityType } = activity;
    
    // Check for _LIKED or _UNLIKED activity types first (roses)
    if (activityType.includes('_LIKED') || activityType.includes('_UNLIKED')) {
      return <GiRose className="w-5 h-5 text-red-400 fill-current" />;
    }
    
    // For comments, check the activity type
    if (entityType === 'COMMENT') {
      if (activityType.includes('UPVOTED')) {
        return <FiThumbsUp className="w-5 h-5 text-green-400" />;
      }
      if (activityType.includes('DOWNVOTED')) {
        return <FiThumbsDown className="w-5 h-5 text-red-400" />;
      }
      if (activityType.includes('COMMENT_CREATED')) {
        return <FiMessageCircle className="w-5 h-5 text-blue-400" />;
      }
    }
    
    // For other entities, use entityType
    switch (entityType) {
      case 'REVIEW':
        return <FaPenSquare className="w-5 h-5 text-blue-400" />;
      case 'DISCUSSION':
        return <FaMugHot className="w-5 h-5 text-orange-400" />;
      case 'WATCHLIST':
        return <FiList className="w-5 h-5 text-purple-400" />;
      case 'PREDICTION':
        return <span className="text-xl">🎯</span>;
      default:
        return <span className="text-xl">📝</span>;
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const { activityType, metadata, user, giver } = activity;
    // For engagement activities on someone else's profile, the giver is the actor
    // For incoming activities on own profile, the giver is also the actor
    // For content creation, the user is the actor
    const giverUsername = giver?.username || 'User';
    const receiverUsername = user?.username || 'User';
    
    // Determine if this is an incoming activity (user received something)
    // For incoming mode, all activities are incoming
    // For other modes, check if there's a giver and it's not the profile owner
    const isIncoming = filterMode === 'incoming' || (isOwnProfile && activity.giverId && activity.giverId !== userId);
    
    // For engagement activities (likes, upvotes)
    if (activityType.includes('LIKE') || activityType.includes('UPVOTE')) {
      // Check if giver and receiver are the same (self-interaction)
      const isSelfInteraction = giverUsername === receiverUsername;
      const possessive = isOwnProfile ? 'your own' : 'their own';
      
      if (activityType.includes('REVIEW_LIKED')) {
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} gave a rose to ${possessive} review of ${metadata?.entityName || 'a show'}`;
        }
        if (isIncoming) {
          return `${giverUsername} gave you a rose for your review of ${metadata?.entityName || 'a show'}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} gave a rose to ${receiverUsername}'s review of ${metadata?.entityName || 'a show'}`;
        }
      }
      if (activityType.includes('DISCUSSION_LIKED')) {
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} gave a rose to ${possessive} discussion: ${metadata?.entityName || 'a show'}`;
        }
        if (isIncoming) {
          return `${giverUsername} gave you a rose for your discussion: ${metadata?.entityName || 'a show'}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} gave a rose to ${receiverUsername}'s discussion: ${metadata?.entityName || 'a show'}`;
        }
      }
      if (activityType.includes('WATCHLIST_LIKED')) {
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} gave a rose to ${possessive} watchlist: ${metadata?.entityName || 'Untitled'}`;
        }
        if (isIncoming) {
          return `${giverUsername} gave you a rose for your watchlist: ${metadata?.entityName || 'Untitled'}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} gave a rose to ${receiverUsername}'s watchlist: ${metadata?.entityName || 'Untitled'}`;
        }
      }
      if (activityType.includes('COMMENT_UPVOTED')) {
        const discussionContext = metadata?.discussionTitle ? ` on discussion: ${metadata.discussionTitle}` : '';
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} upvoted ${possessive} comment${discussionContext}`;
        }
        if (isIncoming) {
          return `${giverUsername} upvoted your comment${discussionContext}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} upvoted ${receiverUsername}'s comment${discussionContext}`;
        }
      }
    }
    
    if (activityType.includes('UNLIKE') || activityType.includes('DOWNVOTE')) {
      // Check if giver and receiver are the same (self-interaction)
      const isSelfInteraction = giverUsername === receiverUsername;
      const possessive = isOwnProfile ? 'your own' : 'their own';
      
      if (activityType.includes('REVIEW_UNLIKED')) {
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} removed a rose from ${possessive} review of ${metadata?.entityName || 'a show'}`;
        }
        if (isIncoming) {
          return `${giverUsername} removed a rose from your review of ${metadata?.entityName || 'a show'}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} removed a rose from ${receiverUsername}'s review of ${metadata?.entityName || 'a show'}`;
        }
      }
      if (activityType.includes('DISCUSSION_UNLIKED')) {
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} removed a rose from ${possessive} discussion: ${metadata?.entityName || 'a show'}`;
        }
        if (isIncoming) {
          return `${giverUsername} removed a rose from your discussion: ${metadata?.entityName || 'a show'}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} removed a rose from ${receiverUsername}'s discussion: ${metadata?.entityName || 'a show'}`;
        }
      }
      if (activityType.includes('WATCHLIST_UNLIKED')) {
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} removed a rose from ${possessive} watchlist: ${metadata?.entityName || 'Untitled'}`;
        }
        if (isIncoming) {
          return `${giverUsername} removed a rose from your watchlist: ${metadata?.entityName || 'Untitled'}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} removed a rose from ${receiverUsername}'s watchlist: ${metadata?.entityName || 'Untitled'}`;
        }
      }
      if (activityType.includes('COMMENT_DOWNVOTED')) {
        const discussionContext = metadata?.discussionTitle ? ` on discussion: ${metadata.discussionTitle}` : '';
        if (isSelfInteraction) {
          return `${isOwnProfile ? 'You' : giverUsername} downvoted ${possessive} comment${discussionContext}`;
        }
        if (isIncoming) {
          return `${giverUsername} downvoted your comment${discussionContext}`;
        } else {
          return `${isOwnProfile ? 'You' : giverUsername} downvoted ${receiverUsername}'s comment${discussionContext}`;
        }
      }
    }
    
    // For content creation activities
    if (activityType.includes('REVIEW_CREATED')) {
      return `${isOwnProfile ? 'You' : receiverUsername} left a review on ${metadata?.entityName || 'a show'}`;
    }
    if (activityType.includes('DISCUSSION_CREATED')) {
      const discussionTitle = metadata?.discussionTitle || '';
      const entityName = metadata?.entityName || '';
      const context = entityName ? ` about ${entityName}` : '';
      return `${isOwnProfile ? 'You' : receiverUsername} started a discussion${context}: ${discussionTitle}`;
    }
    if (activityType.includes('WATCHLIST_CREATED')) {
      return `${isOwnProfile ? 'You' : receiverUsername} created a watchlist: ${metadata?.entityName || 'Untitled'}`;
    }
    if (activityType.includes('COMMENT_CREATED')) {
      // Check if giver and receiver are the same (self-interaction)
      const isSelfInteraction = giverUsername === receiverUsername;
      const contentType = metadata?.contentType === 'discussion' ? 'discussion' : 
                         metadata?.contentType === 'watchlist' ? 'watchlist' : 
                         'review';
      
      if (isSelfInteraction) {
        // Someone left a comment on their own content
        const possessive = isOwnProfile ? 'your own' : 'their own';
        if (contentType === 'discussion') {
          const discussionTitle = metadata?.contentName || '';
          const aboutEntity = metadata?.discussionAboutEntityName || '';
          return `${isOwnProfile ? 'You' : giverUsername} left a comment on ${possessive} discussion${aboutEntity ? ` about ${aboutEntity}` : ''}: ${discussionTitle}`;
        }
        
        if (contentType === 'watchlist') {
          const watchlistName = metadata?.entityName || metadata?.contentName || 'Untitled';
          return `${isOwnProfile ? 'You' : giverUsername} left a comment on ${possessive} watchlist: ${watchlistName}`;
        }
        
        const entityName = metadata?.entityName || '';
        return `${isOwnProfile ? 'You' : giverUsername} left a comment on ${possessive} ${contentType} of ${entityName}`;
      }
      
      if (isIncoming) {
        // Someone left a comment on your content
        if (contentType === 'discussion') {
          const discussionTitle = metadata?.contentName || '';
          const aboutEntity = metadata?.discussionAboutEntityName || '';
          return `${giverUsername} left a comment on your discussion${aboutEntity ? ` about ${aboutEntity}` : ''}: ${discussionTitle}`;
        }
        
        if (contentType === 'watchlist') {
          const watchlistName = metadata?.entityName || metadata?.contentName || 'Untitled';
          return `${giverUsername} left a comment on your watchlist: ${watchlistName}`;
        }
        
        const entityName = metadata?.entityName || '';
        return `${giverUsername} left a comment on your ${contentType} of ${entityName}`;
      } else {
        // You left a comment on someone's content
        if (contentType === 'discussion') {
          const discussionTitle = metadata?.contentName || '';
          const aboutEntity = metadata?.discussionAboutEntityName || '';
          return `${isOwnProfile ? 'You' : giverUsername} left a comment on ${receiverUsername}'s discussion${aboutEntity ? ` about ${aboutEntity}` : ''}: ${discussionTitle}`;
        }
        
        if (contentType === 'watchlist') {
          const watchlistName = metadata?.entityName || metadata?.contentName || 'Untitled';
          return `${isOwnProfile ? 'You' : giverUsername} left a comment on ${receiverUsername}'s watchlist: ${watchlistName}`;
        }
        
        const entityName = metadata?.entityName || '';
        return `${isOwnProfile ? 'You' : giverUsername} left a comment on ${receiverUsername}'s ${contentType} of ${entityName}`;
      }
    }
    
    // Fallback to original description
    return activity.description;
  };

  const shouldShowPoints = (activity: ActivityItem) => {
    const { activityType } = activity;
    
    // If not on own profile or not in "You" mode, always show points
    if (!isOwnProfile || filterMode !== 'you') {
      return true;
    }
    
    // If on own profile in "You" mode, only show points for activities where the user earned points themselves
    // Don't show points for activities where the user performed an action that awards points to someone else
    
    // Content creation activities - user earned points for creating content
    if (activityType.includes('_CREATED')) {
      return true;
    }
    
    // Engagement activities where user received points (incoming likes, upvotes, etc.)
    // These would be in "Incoming" mode, not "You" mode
    if (activityType.includes('_LIKED') || activityType.includes('_UNLIKED') || 
        activityType.includes('_UPVOTED') || activityType.includes('_DOWNVOTED')) {
      // In "You" mode, these activities are where the user performed the action (gave like/upvote)
      // The points would go to the receiver, not the user, so don't show points
      return false;
    }
    
    // Prediction market activities - user earned/lost points
    if (activityType.includes('PREDICTION_') || activityType.includes('SHARES_')) {
      return true;
    }
    
    // Social activities - user performed the action
    if (activityType.includes('USER_FOLLOWED') || activityType.includes('USER_UNFOLLOWED')) {
      return false; // User performed the action, points go to the followed user
    }
    
    // Default to showing points for other activities
    return true;
  };

  const getActivityLink = (activity: ActivityItem) => {
    const { activityType, entityId, user, metadata } = activity;
    
    // For comment upvotes/downvotes on discussions, link to the discussion
    if (activityType.includes('COMMENT_UPVOTED') || activityType.includes('COMMENT_DOWNVOTED')) {
      if (metadata?.discussionId && metadata?.discussionAboutEntityType && metadata?.discussionAuthorUsername) {
        return `/${metadata.discussionAuthorUsername}/discussion/${metadata.discussionAboutEntityType}/${metadata.discussionId}`;
      }
      return null;
    }
    
    // For reviews: /username/review/entityType/entityId
    if (activityType.includes('REVIEW_CREATED') || activityType.includes('REVIEW_LIKED') || activityType.includes('REVIEW_UNLIKED')) {
      return `/${user?.username}/review/${metadata?.entityType}/${entityId}`;
    }
    
    // For discussions: /username/discussion/entityType/entityId
    if (activityType.includes('DISCUSSION_CREATED') || activityType.includes('DISCUSSION_LIKED') || activityType.includes('DISCUSSION_UNLIKED')) {
      return `/${user?.username}/discussion/${metadata?.entityType}/${entityId}`;
    }
    
    // For watchlists: /username/watch-list/entityId
    if (activityType.includes('WATCHLIST_CREATED') || activityType.includes('WATCHLIST_LIKED') || activityType.includes('WATCHLIST_UNLIKED')) {
      return `/${user?.username}/watch-list/${entityId}`;
    }
    
    // For comments: link to the original content that was commented on
    if (activityType.includes('COMMENT_CREATED')) {
      const contentType = metadata?.contentType; // 'show', 'season', 'episode', 'watchlist', or 'discussion'
      const contentId = metadata?.reviewId || metadata?.discussionId || metadata?.watchListId;
      
      if (contentType === 'watchlist') {
        return `/${user?.username}/watch-list/${contentId}`;
      } else if (contentType === 'discussion') {
        return `/${user?.username}/discussion/${metadata?.discussionAboutEntityType}/${metadata?.discussionId}`;
      } else if (contentType && contentId) {
        return `/${user?.username}/review/${contentType}/${contentId}`;
      }
    }
    
    return null;
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4" data-activity-feed-header>
        <h2 className="text-xl font-semibold text-green-500">Activity Feed</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm"
          >
            <FiFilter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>
      <div className="border-b border-gray-600 mb-4"></div>

      {/* Filter Mode Buttons - Only show for own profile */}
      {isOwnProfile && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilterMode('you')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filterMode === 'you'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
            }`}
            title="Show what you did (likes, content creation)"
          >
            You
          </button>
          <button
            onClick={() => setFilterMode('incoming')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filterMode === 'incoming'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
            }`}
            title="Show what others did to you (liked your content, commented)"
          >
            Incoming
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Groups */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Activity Groups
                </label>
                <button
                  onClick={handleSelectAllGroups}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Select All
                </button>
              </div>
              <div className="space-y-2">
                {Object.values(ActivityGroup)
                  .filter(group => {
                    // For incoming mode on own profile, exclude CONTENT_CREATION
                    if (isOwnProfile && filterMode === 'incoming' && group === 'CONTENT_CREATION') {
                      return false;
                    }
                    return true;
                  })
                  .map(group => (
                  <label key={group} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.activityGroups.includes(group)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            activityGroups: [...prev.activityGroups, group]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            activityGroups: prev.activityGroups.filter(g => g !== group)
                          }));
                        }
                      }}
                      className="rounded text-green-600 bg-gray-600 border-gray-500 focus:ring-green-500 focus:ring-2"
                      style={{ accentColor: "#16a34a" }}
                    />
                    <span className="text-gray-300">
                      {group === 'CONTENT_CREATION' ? 'Content Creation' :
                       group === 'ENGAGEMENT' ? 'Engagement' :
                       group === 'DISENGAGEMENT' ? 'Disengagement' :
                       group === 'PREDICTION_MARKET' ? 'Prediction Market' :
                       group === 'SOCIAL' ? 'Social' :
                       String(group).replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyDateFilter}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={handleRemoveDateFilter}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Remove Filter
                  </button>
                </div>
              </div>
              <div className="flex">
                <div className="w-24 sm:w-32" style={{ marginRight: '20px' }}>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateFilters.startDate}
                    max={dateFilters.endDate || undefined}
                    onChange={(e) => {
                      setDateFilters(prev => ({ ...prev, startDate: e.target.value }));
                      setDateError('');
                    }}
                    className="w-full px-1 py-2 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:ring-green-500 focus:border-green-500"
                    style={{ fontSize: '11px' }}
                  />
                </div>
                <div className="w-24 sm:w-32">
                  <label className="block text-xs text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateFilters.endDate}
                    min={dateFilters.startDate || undefined}
                    onChange={(e) => {
                      setDateFilters(prev => ({ ...prev, endDate: e.target.value }));
                      setDateError('');
                    }}
                    className="w-full px-1 py-2 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:ring-green-500 focus:border-green-500"
                    style={{ fontSize: '11px' }}
                  />
                </div>
              </div>
              {dateError && (
                <div className="mt-2 text-xs text-red-400">
                  {dateError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 md:max-h-[500px] md:overflow-y-auto md:pr-2">
          {activities.map((activity) => {
          const activityLink = getActivityLink(activity);
          const ActivityWrapper = activityLink ? 'a' : 'div';
          
          return (
            <ActivityWrapper
              key={activity.id}
              href={activityLink || undefined}
              className={`flex items-start gap-3 p-4 bg-gray-900 border border-gray-700 rounded-lg transition-colors text-sm ${
                activityLink ? 'hover:bg-gray-600 cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8">{getActivityIcon(activity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm">
                    {getActivityDescription(activity)}
                  </span>
                  {!activity.isPublic && isOwnProfile && (
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded flex items-center gap-1">
                      <FiEyeOff className="w-3 h-3" />
                      Private
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatActivityTime(activity.createdAt)}</span>
                  {activity.points > 0 && shouldShowPoints(activity) && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <FaStar className="w-3 h-3" />
                      <span>+{activity.points}</span>
                    </div>
                  )}
                </div>
              </div>
            </ActivityWrapper>
          );
        })}

          {activities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No activities found</p>
            </div>
          )}
        </div>

      )}

      {/* Pagination Controls - Outside the scrolling container */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || loading}
            className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          
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
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className={`px-3 py-2 rounded transition-colors ${
                    currentPage === pageNum
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } disabled:opacity-50 text-sm`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={loading}
                  className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
