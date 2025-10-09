"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { FiTwitter, FiInstagram, FiCalendar, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '@clerk/nextjs';
import FollowModal from './FollowModal';

interface UserProfileHeaderProps {
  user: {
    id: string;
    username: string;
    imageUrl: string;
    bio: string | null;
    twitter: string | null;
    instagram: string | null;
    createdAt: Date;
    starPoints: number;
    topFourShows: Array<{
      id: number;
      name: string;
      posterPath: string | null;
    }>;
  };
  isOwnProfile: boolean;
}

export default function UserProfileHeader({ user, isOwnProfile }: UserProfileHeaderProps) {
  const pathname = usePathname();
  // Enable profile link when not on the root profile page
  const enableProfileLink = pathname !== `/${user.username}`;
  
  const { userId: currentUserId } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutualFollow, setIsMutualFollow] = useState(false);
  const [followStatusLoading, setFollowStatusLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const displayName = user.username;

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  // Fetch follow status on component mount
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (isOwnProfile) {
        setFollowStatusLoading(false);
        return;
      }

      // Only fetch follow status if user is logged in
      if (!currentUserId) {
        setFollowStatusLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${user.username}/follow-status`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing || false);
          setIsMutualFollow(data.isMutualFollow || false);
        }
      } catch (error) {
        console.error('Error fetching follow status:', error);
      } finally {
        setFollowStatusLoading(false);
      }
    };

    fetchFollowStatus();
  }, [user.username, isOwnProfile, currentUserId]);

  // Fetch follower/following counts
  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${user.username}/follow-status?includeCounts=true`);
      if (response.ok) {
        const data = await response.json();
        setFollowerCount(data.followerCount || 0);
        setFollowingCount(data.followingCount || 0);
      }
    } catch (error) {
      console.error('Error fetching follower/following counts:', error);
    }
  }, [user.username]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleFollowToggle = async () => {
    if (!currentUserId) return;

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${user.username}/follow`, {
        method,
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Reset mutual follow status since it will be recalculated on next fetch
        setIsMutualFollow(false);
      } else {
        const error = await response.json();
        console.error('Error toggling follow:', error);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <>
      {/* Desktop Header with backdrop-style banner */}
      <div className="relative h-64 w-full hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-gray-900"></div>
        
        {/* Desktop Profile Info */}
        <div className="relative bg-gradient-to-t from-black/90 to-transparent p-4 md:p-8 h-full">
          <div className="flex items-center gap-6 justify-between h-full">
            <div className="flex items-start gap-6 flex-1">
              {/* Profile Picture and Follow Button */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                {enableProfileLink ? (
                  <Link href={`/${user.username}`} className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-900 hover:opacity-80 transition-opacity cursor-pointer">
                    <Image
                      src={user.imageUrl}
                      alt={`${displayName}'s profile picture`}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-900">
                    <Image
                      src={user.imageUrl}
                      alt={`${displayName}'s profile picture`}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Follow/Unfollow Button - Desktop */}
                {!isOwnProfile && currentUserId && !followStatusLoading && (
                  <button
                    onClick={handleFollowToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isFollowing
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <FiUserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex-1 pb-2 flex flex-col">
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-3 mb-1">
                    {enableProfileLink ? (
                      <Link href={`/${user.username}`}>
                        <h1 className="text-3xl font-bold text-white hover:text-green-400 transition-colors cursor-pointer">
                          {displayName}
                        </h1>
                      </Link>
                    ) : (
                      <h1 className="text-3xl font-bold text-white">
                        {displayName}
                      </h1>
                    )}
                    {/* Friends indicator - Desktop */}
                    {!isOwnProfile && currentUserId && !followStatusLoading && isMutualFollow && (
                      <span className="text-sm text-green-400 font-medium bg-green-500/20 px-3 py-1 rounded-full">
                        Friends
                      </span>
                    )}
                  </div>
                  <p className="text-gray-200">@{user.username}</p>
                  
                  {/* Social Links */}
                  {(user.twitter || user.instagram) && (
                    <div className="flex items-center gap-4 mt-2">
                      {user.twitter && (
                        <a
                          href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
                        >
                          <FiTwitter className="w-5 h-5" />
                          <span className="text-base">@{user.twitter.replace('@', '')}</span>
                        </a>
                      )}
                      
                      {user.instagram && (
                        <a
                          href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-300 hover:text-pink-200 transition-colors"
                        >
                          <FiInstagram className="w-5 h-5" />
                          <span className="text-base">@{user.instagram.replace('@', '')}</span>
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-gray-300 text-sm">
                    <FiCalendar className="w-4 h-4" />
                    <span>Joined {joinDate}</span>
                  </div>
                </div>
                
                {/* Bio - positioned to not push up other elements */}
                {user.bio && (
                  <div className="flex-1 mt-2">
                    <p className="text-gray-200 text-base leading-relaxed max-w-md pr-4">
                      {user.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Side Stats - Desktop */}
            <div className="flex-shrink-0 flex-1 flex items-center justify-center">
              <div className="flex items-center gap-6">
                {/* Star Points */}
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <FaStar className="w-6 h-6 text-yellow-400" />
                    <span className="text-4xl font-bold text-yellow-400">
                      {user.starPoints.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Balance</p>
                </div>

                {/* Divider */}
                <div className="h-16 w-px bg-gray-600"></div>

                {/* Followers */}
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-4xl font-bold text-white mb-1">
                    {followerCount}
                  </div>
                  <p className="text-sm text-gray-400">{followerCount === 1 ? 'Follower' : 'Followers'}</p>
                </button>

                {/* Divider */}
                <div className="h-16 w-px bg-gray-600"></div>

                {/* Following */}
                <button
                  onClick={() => setShowFollowingModal(true)}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-4xl font-bold text-white mb-1">
                    {followingCount}
                  </div>
                  <p className="text-sm text-gray-400">Following</p>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="relative w-full bg-gradient-to-br from-green-900/30 to-gray-900 pb-6">
          <div className="flex flex-col items-center pt-8 px-4">
            {/* Profile Picture */}
            {enableProfileLink ? (
              <Link href={`/${user.username}`} className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-900 hover:opacity-80 transition-opacity cursor-pointer">
                <Image
                  src={user.imageUrl}
                  alt={`${displayName}'s profile picture`}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : (
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-900">
                <Image
                  src={user.imageUrl}
                  alt={`${displayName}'s profile picture`}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* User Info */}
            <div className="text-center mt-4">
              <div className="flex items-center justify-center gap-3 mb-1">
                {enableProfileLink ? (
                  <Link href={`/${user.username}`}>
                    <h1 className="text-2xl font-bold text-white hover:text-green-400 transition-colors cursor-pointer">
                      {displayName}
                    </h1>
                  </Link>
                ) : (
                  <h1 className="text-2xl font-bold text-white">
                    {displayName}
                  </h1>
                )}
                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                  <FaStar className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-xs">
                    {user.starPoints.toLocaleString()}
                  </span>
                </div>
                {/* Friends indicator - Mobile */}
                {!isOwnProfile && currentUserId && !followStatusLoading && isMutualFollow && (
                  <span className="text-xs text-green-400 font-medium bg-green-500/20 px-3 py-1 rounded-full">
                    Friends
                  </span>
                )}
              </div>
              
              {/* Follower/Following Counts - Mobile */}
              <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-white">{followerCount}</span>
                  <span>{followerCount === 1 ? 'follower' : 'followers'}</span>
                </button>
                <button
                  onClick={() => setShowFollowingModal(true)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-white">{followingCount}</span>
                  <span>following</span>
                </button>
              </div>
              
              {/* Follow/Unfollow Button - Mobile */}
              {!isOwnProfile && currentUserId && !followStatusLoading && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={handleFollowToggle}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors text-xs ${
                      isFollowing
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <FiUserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* Bio */}
              {user.bio && (
                <p className="text-gray-200 text-sm mt-3 leading-relaxed max-w-xs mx-auto px-4 break-words">
                  {user.bio}
                </p>
              )}
              
              {/* Social Links */}
              {(user.twitter || user.instagram) && (
                <div className="flex items-center justify-center gap-4 mt-3">
                  {user.twitter && (
                    <a
                      href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      <FiTwitter className="w-4 h-4" />
                      <span className="text-sm">@{user.twitter.replace('@', '')}</span>
                    </a>
                  )}
                  
                  {user.instagram && (
                    <a
                      href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-pink-300 hover:text-pink-200 transition-colors"
                    >
                      <FiInstagram className="w-4 h-4" />
                      <span className="text-sm">@{user.instagram.replace('@', '')}</span>
                    </a>
                  )}
                </div>
              )}
              
              {/* Join Date */}
              <div className="flex items-center justify-center gap-2 mt-3 text-gray-200 text-sm">
                <FiCalendar className="w-4 h-4" />
                <span>Joined {joinDate}</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <FollowModal
          username={user.username}
          type="followers"
          onClose={() => {
            setShowFollowersModal(false);
            fetchCounts();
          }}
          isOpen={showFollowersModal}
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <FollowModal
          username={user.username}
          type="following"
          onClose={() => {
            setShowFollowingModal(false);
            fetchCounts();
          }}
          isOpen={showFollowingModal}
        />
      )}
    </>
  );
}
