"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { useModalScrollPrevention } from '@/hooks/useModalScrollPrevention';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useAuth } from '@clerk/nextjs';

interface FollowUser {
  id: string;
  user: {
    id: string;
    username: string;
    imageUrl: string;
  };
  createdAt: Date;
  isFollowing: boolean;
}

interface FollowModalProps {
  username: string;
  type: 'followers' | 'following';
  onClose: () => void;
  isOpen?: boolean;
}

export default function FollowModal({ username, type, onClose, isOpen = true }: FollowModalProps) {
  const { userId: currentUserId } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;
  
  const hasFetchedRef = useRef(false);
  const currentModalKeyRef = useRef('');

  useModalScrollPrevention(isOpen);
  useEscapeKey(isOpen, onClose);

  const fetchUsers = async (isLoadMore = false, currentOffset: number) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch(`/api/users/${username}/${type}?limit=${LIMIT}&offset=${currentOffset}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }

      const data = await response.json();
      const usersData = type === 'followers' ? data.followers : data.following;
      
      if (isLoadMore) {
        setUsers((prev) => [...prev, ...usersData]);
      } else {
        setUsers(usersData);
      }

      // Update following states
      const newStates: Record<string, boolean> = {};
      usersData.forEach((user: FollowUser) => {
        newStates[user.user.id] = user.isFollowing;
      });
      
      if (isLoadMore) {
        setFollowingStates((prev) => ({ ...prev, ...newStates }));
      } else {
        setFollowingStates(newStates);
      }

      // Check if there are more users to load and update offset
      setHasMore(data.hasMore);
      setOffset(currentOffset + usersData.length);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Failed to load ${type}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchUsers(true, offset);
  };

  useEffect(() => {
    if (isOpen) {
      const modalKey = `${username}-${type}`;
      
      // Only fetch if this is a new modal session
      if (currentModalKeyRef.current !== modalKey || !hasFetchedRef.current) {
        currentModalKeyRef.current = modalKey;
        hasFetchedRef.current = true;
        
        // Reset state when modal opens or type changes
        setUsers([]);
        setOffset(0);
        setHasMore(false);
        setFollowingStates({});
        
        fetchUsers(false, 0);
      }
    } else {
      // Reset when modal closes
      hasFetchedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, type, isOpen]);

  const handleFollowToggle = async (targetUserId: string, targetUsername: string) => {
    if (!currentUserId) return;

    try {
      const isCurrentlyFollowing = followingStates[targetUserId];
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${targetUsername}/follow`, {
        method,
      });

      if (response.ok) {
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: !isCurrentlyFollowing,
        }));
      } else {
        const error = await response.json();
        console.error('Error toggling follow:', error);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm md:bg-white/5 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-xl font-bold text-white capitalize">
            {type}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-24" />
                  </div>
                  <div className="h-9 w-24 bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                No {type} yet
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {users.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    {/* Profile Image */}
                    <Link href={`/${item.user.username}`} onClick={onClose}>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <Image
                          src={item.user.imageUrl}
                          alt={`${item.user.username}'s profile`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* User Info */}
                    <Link 
                      href={`/${item.user.username}`} 
                      onClick={onClose}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="text-white font-medium truncate hover:text-green-400 transition-colors">
                        {item.user.username}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        @{item.user.username}
                      </p>
                    </Link>

                    {/* Follow Button */}
                    {currentUserId && currentUserId !== item.user.id && (
                      <button
                        onClick={() => handleFollowToggle(item.user.id, item.user.username)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-shrink-0 ${
                          followingStates[item.user.id]
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {followingStates[item.user.id] ? (
                          <>
                            <FiUserMinus className="w-4 h-4" />
                            <span className="hidden sm:inline">Unfollow</span>
                          </>
                        ) : (
                          <>
                            <FiUserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

