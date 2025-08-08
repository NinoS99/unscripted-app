"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { FiMessageCircle, FiEdit3 } from "react-icons/fi";
import { GiRose } from "react-icons/gi";
import LikeButton from "./LikeButton";
import Comments from "./Comments";
import { useUser } from "@clerk/nextjs";

interface WatchListShow {
    id: number;
    ranking?: number | null;
    note?: string | null;
    spoiler?: boolean;
    show: {
        id: number;
        name: string;
        posterPath?: string | null;
        firstAirDate?: Date | null;
        tmdbRating?: number | null;
    };
    muchWatchSeasons: {
        season: {
            id: number;
            seasonNumber: number;
        };
    }[];
}

interface WatchListComment {
    id: number;
    content: string;
    createdAt: Date;
    user: {
        id: string;
        username: string;
        profilePicture: string | null;
    };
}

interface WatchList {
    id: number;
    name: string;
    description?: string | null;
    isPublic: boolean;
    friendsOnly: boolean;
    createdAt: Date;
    user: {
        id: string;
        username: string;
        profilePicture: string | null;
    };
    shows: WatchListShow[];
    tags: {
        tag: {
            id: number;
            name: string;
        };
    }[];
    comments: WatchListComment[];
    _count: {
        likes: number;
        comments: number;
    };
}

interface WatchListDetailProps {
    watchList: WatchList;
    userId?: string | null;
    userLiked: boolean;
}

export default function WatchListDetail({ watchList, userLiked }: WatchListDetailProps) {
    const { user } = useUser();
    const [comments, setComments] = useState(watchList.comments);
    const [showSpoilers, setShowSpoilers] = useState<{ [key: number]: boolean }>({});
    const [likeCount, setLikeCount] = useState(watchList._count.likes);



    const toggleSpoiler = (showId: number) => {
        setShowSpoilers(prev => ({
            ...prev,
            [showId]: !prev[showId]
        }));
    };

    const formatDateShort = (date: Date | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', { 
            year: '2-digit', 
            month: '2-digit', 
            day: '2-digit' 
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start gap-6">
                        {/* User Profile */}
                        <div className="flex-shrink-0">
                            <Link href={`/${watchList.user.username}`}>
                                <Image
                                    src={watchList.user.profilePicture || "/noAvatar.png"}
                                    alt={watchList.user.username}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 rounded-full object-cover hover:opacity-80 transition-opacity"
                                />
                            </Link>
                        </div>
                        
                        <div className="flex-grow">
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-gray-400 text-sm">Watch list by</span>
                                <Link 
                                    href={`/${watchList.user.username}`}
                                    className="text-sm font-bold text-white hover:text-green-400 transition-colors"
                                >
                                    {watchList.user.username}
                                </Link>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-400">
                                    {format(new Date(watchList.createdAt), "MMM d, yyyy")}
                                </span>
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {watchList.name}
                            </h1>
                            
                            {watchList.description && (
                                <p className="text-gray-300 text-lg mb-4 leading-relaxed">
                                    {watchList.description}
                                </p>
                            )}

                            {/* Tags */}
                            {watchList.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {watchList.tags.map(({ tag }) => (
                                        <span
                                            key={tag.id}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-full"
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-gray-300">
                                <span>{watchList.shows.length} show{watchList.shows.length !== 1 ? 's' : ''}</span>
                                <div className="flex items-center gap-1">
                                    <GiRose className="w-4 h-4 text-red-400 fill-current" />
                                    <span>{likeCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FiMessageCircle className="w-4 h-4" />
                                    <span>{comments.length}</span>
                                </div>
                                {user && user.id === watchList.user.id && (
                                    <Link
                                        href={`/${watchList.user.username}/watch-list/${watchList.id}/edit`}
                                        className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors"
                                    >
                                        <FiEdit3 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shows List */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-green-500 mb-6">
                        Shows ({watchList.shows.length})
                    </h2>
                    
                    <div className="space-y-0">
                        {watchList.shows.map((watchListShow, index) => (
                            <div key={watchListShow.id} className={`p-4 ${index < watchList.shows.length - 1 ? 'border-b border-gray-700' : ''}`}>
                                <div className="flex items-start gap-4">
                                    {/* Ranking */}
                                    {watchListShow.ranking && (
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                {watchListShow.ranking}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Show Poster */}
                                    <div className="flex-shrink-0">
                                        <Link href={`/show/${watchListShow.show.id}`}>
                                            <Image
                                                src={watchListShow.show.posterPath ? `https://image.tmdb.org/t/p/w154${watchListShow.show.posterPath}` : "/noPoster.jpg"}
                                                alt={watchListShow.show.name}
                                                width={154}
                                                height={231}
                                                className="w-20 h-30 rounded object-cover hover:opacity-80 transition-opacity"
                                            />
                                        </Link>
                                    </div>
                                    
                                    {/* Show Info */}
                                    <div className="flex-grow min-w-0">
                                        <Link 
                                            href={`/show/${watchListShow.show.id}`}
                                            className="text-xl font-semibold text-white hover:text-green-400 transition-colors mb-1"
                                        >
                                            {watchListShow.show.name}
                                        </Link>
                                        
                                        {watchListShow.show.firstAirDate && (
                                            <p className="text-gray-400 text-sm mb-2">
                                                First aired {formatDateShort(watchListShow.show.firstAirDate)}
                                            </p>
                                        )}

                                        {/* Note */}
                                        {watchListShow.note && (
                                            <div className="mb-3">
                                                {watchListShow.spoiler ? (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-red-400 text-sm font-medium">⚠️ SPOILER</span>
                                                            <button
                                                                onClick={() => toggleSpoiler(watchListShow.id)}
                                                                className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                                                            >
                                                                {showSpoilers[watchListShow.id] ? "Hide Spoiler" : "Show Spoiler"}
                                                            </button>
                                                        </div>
                                                        <p className={`text-gray-200 leading-relaxed transition-all duration-300 ${
                                                            showSpoilers[watchListShow.id] 
                                                                ? "blur-none" 
                                                                : "blur-sm select-none"
                                                        }`}>
                                                            {watchListShow.note}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-200 leading-relaxed">
                                                        {watchListShow.note}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Must-Watch Seasons */}
                                        {watchListShow.muchWatchSeasons.length > 0 && (
                                            <div className="mb-2">
                                                <span className="text-green-400 text-sm font-medium">Must-watch seasons: </span>
                                                <span className="text-gray-300 text-sm">
                                                    {watchListShow.muchWatchSeasons.map(({ season }, idx) => (
                                                        <span key={season.id}>
                                                            {season.seasonNumber === 0 ? 'Specials' : `Season ${season.seasonNumber}`}
                                                            {idx < watchListShow.muchWatchSeasons.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Like Button */}
                <div className="mb-8">
                    <LikeButton
                        entityType="watchList"
                        entityId={watchList.id}
                        initialIsLiked={userLiked}
                        size="lg"
                        onLikeChange={(isLiked) => {
                            setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
                        }}
                    />
                </div>

                {/* Comments Section */}
                <Comments
                    entityType="watchList"
                    entityId={watchList.id}
                    comments={comments}
                    onCommentAdded={(comment) => {
                        setComments(prev => [comment, ...prev]);
                    }}
                />
            </div>
        </div>
    );
} 