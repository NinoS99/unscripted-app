"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { FiMessageCircle, FiHeart, FiPlus } from "react-icons/fi";
import { GiRose } from "react-icons/gi";

interface User {
    id: string;
    username: string;
}

interface WatchListShow {
    id: number;
    ranking?: number | null;
    show: {
        id: number;
        name: string;
        posterPath?: string | null;
    };
}

interface WatchList {
    id: number;
    name: string;
    description?: string | null;
    isPublic: boolean;
    friendsOnly: boolean;
    createdAt: Date;
    shows: WatchListShow[];
    tags: {
        tag: {
            id: number;
            name: string;
        };
    }[];
    _count: {
        likes: number;
        comments: number;
    };
}

interface UserWatchListsProps {
    user: User;
    watchLists: WatchList[];
    isOwnProfile: boolean;
}

export default function UserWatchLists({
    user,
    watchLists,
    isOwnProfile,
}: UserWatchListsProps) {
    const { user: currentUser } = useUser();

    const truncateDescription = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <div className="px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-green-500">
                    Watch lists by {isOwnProfile ? 'You' : user.username}
                </h1>
                <p className="text-gray-400 mt-2">
                    {watchLists.length} watch list{watchLists.length !== 1 ? 's' : ''}
                </p>
            </div>

                {/* Watch Lists Grid */}
                {watchLists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {watchLists.map((watchList) => (
                            <Link
                                key={watchList.id}
                                href={`/${user.username}/watch-list/${watchList.id}`}
                                className="block bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-gray-700">
                                    <h3 className="text-xl font-semibold mb-2">
                                        {watchList.name}
                                    </h3>
                                    {watchList.description && (
                                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                            {truncateDescription(
                                                watchList.description
                                            )}
                                        </p>
                                    )}

                                    {/* Privacy Label */}
                                    <div className="flex items-center gap-1 mb-3">
                                        {watchList.isPublic ? (
                                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                                Public
                                            </span>
                                        ) : watchList.friendsOnly ? (
                                            <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
                                                Friends Only
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
                                                Private
                                            </span>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm text-gray-400">
                                        <span>
                                            {watchList.shows.length} show
                                            {watchList.shows.length !== 1
                                                ? "s"
                                                : ""}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <GiRose className="w-4 h-4 text-red-400" />
                                                <span>
                                                    {watchList._count.likes}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FiMessageCircle className="w-4 h-4" />
                                                <span>
                                                    {watchList._count.comments}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shows Preview */}
                                <div className="p-4 pt-2">
                                    <div className="flex gap-2 w-full">
                                        {watchList.shows
                                            .slice(0, 5)
                                            .map((watchListShow) => (
                                                <div
                                                    key={watchListShow.id}
                                                    className="flex-shrink-0 relative"
                                                >
                                                    <Image
                                                        src={
                                                            watchListShow.show
                                                                .posterPath
                                                                ? `https://image.tmdb.org/t/p/w92${watchListShow.show.posterPath}`
                                                                : "/noPoster.jpg"
                                                        }
                                                        alt={
                                                            watchListShow.show
                                                                .name
                                                        }
                                                        width={46}
                                                        height={69}
                                                        className="w-11 h-16 rounded object-cover"
                                                    />
                                                    {watchListShow.ranking && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                            {
                                                                watchListShow.ranking
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        {watchList.shows.length > 5 && (
                                            <div className="flex-shrink-0 w-11 h-16 flex items-center text-gray-400 text-xs ml-2">
                                                +{watchList.shows.length - 5}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date at card bottom */}
                                <div className="px-4 pb-4">
                                    <p className="text-gray-400 text-xs">
                                        Created{" "}
                                        {format(
                                            new Date(watchList.createdAt),
                                            "MMM d, yyyy"
                                        )}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <FiHeart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">
                                {isOwnProfile
                                    ? "No watch lists yet"
                                    : "No public watch lists"}
                            </h3>
                            <p className="text-gray-500">
                                {isOwnProfile
                                    ? "Create your first watch list to get started!"
                                    : `${user.username} hasn't created any public watch lists yet.`}
                            </p>
                        </div>
                        {isOwnProfile && currentUser && (
                            <Link
                                href="/watch-list/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                <FiPlus className="w-5 h-5" />
                                Create Your First Watch List
                            </Link>
                        )}
                    </div>
                )}
        </div>
    );
}
