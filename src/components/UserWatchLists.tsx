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
    profilePicture: string | null;
    bio?: string | null;
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
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 md:gap-6 mb-6">
                        <Link href={`/${user.username}`}>
                            <Image
                                src={user.profilePicture || "/noAvatar.png"}
                                alt={user.username}
                                width={80}
                                height={80}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover hover:opacity-80 transition-opacity"
                            />
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-3xl font-bold mb-2">
                                Watch lists crafted by{" "}
                                <Link
                                    href={`/${user.username}`}
                                    className="text-green-400 hover:text-green-300 transition-colors"
                                >
                                    {user.username}
                                </Link>
                            </h1>
                            {user.bio && (
                                <p className="text-gray-300 text-base md:text-lg">
                                    {user.bio}
                                </p>
                            )}
                        </div>
                    </div>
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

                                    {/* Tags */}
                                    {watchList.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {watchList.tags
                                                .slice(0, 3)
                                                .map(({ tag }) => (
                                                    <span
                                                        key={tag.id}
                                                        className="px-2 py-1 bg-green-600 text-white text-xs rounded-full"
                                                    >
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            {watchList.tags.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                                                    +{watchList.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

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
                                <div className="p-4">
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

                                    {/* Date and Privacy */}
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-gray-400 text-xs">
                                            Created{" "}
                                            {format(
                                                new Date(watchList.createdAt),
                                                "MMM d, yyyy"
                                            )}
                                        </p>
                                        {isOwnProfile && (
                                            <div className="flex items-center gap-1">
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
                                        )}
                                    </div>
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
        </div>
    );
}
