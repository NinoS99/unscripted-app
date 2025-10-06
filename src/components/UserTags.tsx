"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface UserTagsProps {
  username: string;
  hideOnMobile?: boolean;
}

interface TagData {
  id: string;
  name: string;
  usage_count: number;
  last_used_at: string;
  source_types: string[];
}

interface UserTagsData {
  tags: TagData[];
  pagination: {
    total: number;
    limit: number;
    hasMore: boolean;
  };
}

export default function UserTags({ username, hideOnMobile = false }: UserTagsProps) {
  const [tagsData, setTagsData] = useState<UserTagsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${username}/tags?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setTagsData(data);
      } else {
        console.error('Failed to fetch tags');
        setTagsData(null);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTagsData(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchTagsRef = useRef(fetchTags);
  fetchTagsRef.current = fetchTags;

  useEffect(() => {
    fetchTagsRef.current();
  }, []);

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

  // Hide on mobile if hideOnMobile is true
  if (isMobile && hideOnMobile) {
    return null;
  }

  return (
    <div className="rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl md:text-lg font-semibold text-green-500 md:mb-1">Tags</h3>
        <button
          onClick={toggleCollapse}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          aria-label={isCollapsed ? "Expand tags" : "Collapse tags"}
        >
          <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </div>
      <div className="border-b border-gray-600 mb-4"></div>

      {/* Content Area */}
      <div>
        {loading ? (
          <div className="animate-pulse">
            <div className="space-y-4">
              {/* Tags Skeleton */}
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-8"></div>
                </div>
              ))}
            </div>
          </div>
        ) : !tagsData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Unable to load tags</p>
          </div>
        ) : (
          <>
            {/* Content - Show when not collapsed */}
            <div className={`transition-all duration-300 ease-in-out ${!isCollapsed ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
              {!isCollapsed && (
                <>
                  {tagsData.tags.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-400">No tags found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {tagsData.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition-colors"
                          >
                            <span>{tag.name}</span>
                            <span className="text-gray-500 text-xs">({tag.usage_count})</span>
                          </span>
                        ))}
                      </div>
                      
                      {tagsData.pagination.hasMore && (
                        <div className="text-center pt-2">
                          <p className="text-xs text-gray-500">
                            Showing {tagsData.tags.length} of {tagsData.pagination.total} tags
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
