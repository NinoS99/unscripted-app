"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { FiTag, FiUser, FiStar, FiMessageCircle } from "react-icons/fi";
import { GiRose } from "react-icons/gi";
import LikeButton from "./LikeButton";
import Comments from "./Comments";

interface ReviewDisplayProps {
            review: {
            id: number;
            content: string;
            startedOn?: Date | null;
            endedOn?: Date | null;
            watchedOn?: Date | null;
            spoiler: boolean;
            createdAt: Date;
            userRating?: number;
            userFavorite?: boolean;
            user: {
                id: string;
                username: string;
                profilePicture?: string | null;
            };
            tags: Array<{
                tag: {
                    id: number;
                    name: string;
                };
            }>;
            favouriteCharacters?: Array<{
                character: {
                    id: number;
                    showRole: string | null;
                    person: {
                        id: number;
                        name: string;
                        profilePath: string | null;
                    };
                    season?: {
                        id: number;
                        seasonNumber: number;
                    };
                };
            }>;
            likes: Array<{ id: number }>;
            comments?: Array<{
                id: number;
                content: string;
                createdAt: Date;
                user: {
                    id: string;
                    username: string;
                    profilePicture?: string | null;
                };
            }>;
            _count: {
                likes: number;
                comments: number;
            };
        };
    reviewType: "show" | "season" | "episode";
    entity: {
        id: number;
        name?: string;
        posterPath?: string | null;
        stillPath?: string | null;
        firstAirDate?: Date | null;
        airDate?: Date | null;
        episodeNumber?: number;
        seasonNumber?: number;
        show?: {
            id: number;
            name: string;
            posterPath?: string | null;
        };
        season?: {
            id: number;
            seasonNumber: number;
            show: {
                id: number;
                name: string;
                posterPath?: string | null;
            };
        };
    };
    // Available image paths for fallback
    availableImages?: {
        episodeStillPath?: string | null;
        seasonPosterPath?: string | null;
        showPosterPath?: string | null;
    };
}

export default function ReviewDisplay({ 
    review, 
    reviewType, 
    entity,
    availableImages = {}
}: ReviewDisplayProps) {
    const [comments, setComments] = useState(review.comments || []);
    const [likeCount, setLikeCount] = useState(review._count.likes || 0);
    const getEntityName = () => {
        switch (reviewType) {
            case "show":
                return entity?.name || "Unknown Show";
            case "season":
                return `${entity?.show?.name || "Unknown Show"} - ${entity?.seasonNumber === 0 ? "Specials" : `Season ${entity?.seasonNumber}`}`;
            case "episode":
                return `${entity?.season?.show?.name || "Unknown Show"} - ${entity?.season?.seasonNumber === 0 ? "S" : `S${entity?.season?.seasonNumber}E`}${entity?.episodeNumber} - ${entity?.name || "Unknown Episode"}`;
        }
    };

    const getAirDate = () => {
        switch (reviewType) {
            case "show":
                return entity?.firstAirDate;
            case "season":
                return entity?.airDate;
            case "episode":
                return entity?.airDate;
        }
    };

    const getPosterPath = () => {
        switch (reviewType) {
            case "show":
                return entity?.posterPath;
            case "season":
                // Priority order: season poster → show poster
                return entity?.posterPath || 
                       availableImages?.showPosterPath;
            case "episode":
                // Priority order: episode still → season poster → show poster
                return availableImages?.episodeStillPath || 
                       availableImages?.seasonPosterPath || 
                       availableImages?.showPosterPath;
        }
    };

    const getDesktopPosterPath = () => {
        switch (reviewType) {
            case "show":
                return entity?.posterPath;
            case "season":
                return availableImages?.seasonPosterPath || 
                       availableImages?.showPosterPath;
            case "episode":
                // For desktop, prefer season poster → show poster (skip episode still)
                return availableImages?.seasonPosterPath || 
                       availableImages?.showPosterPath;
        }
    };

    const getEntityLink = () => {
        switch (reviewType) {
            case "show":
                return `/show/${entity?.id}`;
            case "season":
                return `/show/${entity?.show?.id || 0}/season/${entity?.seasonNumber}`;
            case "episode":
                return `/show/${entity?.season?.show?.id || 0}/season/${entity?.season?.seasonNumber || 0}/episode/${entity?.episodeNumber || 0}`;
        }
    };

    const getFavouriteCharacters = () => {
        if (reviewType === "episode") return null;
        return review.favouriteCharacters?.map((fc) => fc.character) || [];
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-0 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Mobile Layout */}
                        <div className="md:hidden mb-8 -mx-4">
                            {/* Full-width poster with overlay */}
                            <div
                                className="relative w-screen"
                                style={{ 
                                    height: "auto", 
                                    aspectRatio: reviewType === "episode" && availableImages?.episodeStillPath ? "16/9" : "2/3" 
                                }}
                            >
                                <Link href={getEntityLink()}>
                                    <Image
                                        src={getPosterPath() ? `https://image.tmdb.org/t/p/w780${getPosterPath()}` : "/noPoster.jpg"}
                                        alt={getEntityName()}
                                        width={780}
                                        height={reviewType === "episode" && availableImages?.episodeStillPath ? 439 : 1170}
                                        className="w-full h-full object-cover absolute inset-0"
                                        priority
                                        quality={90}
                                    />
                                </Link>

                                {/* Overlay with entity info */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-10">
                                    <h1 className="text-xl font-bold text-white mb-1">
                                        <Link 
                                            href={getEntityLink()}
                                            className="hover:text-green-400 transition-colors"
                                        >
                                            {getEntityName()}
                                        </Link>
                                    </h1>
                                    {getAirDate() && (
                                        <p className="text-sm text-gray-200">
                                            Aired on {format(getAirDate()!, "MMMM d, yyyy")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Mobile info below poster */}
                            <div className="mt-4 space-y-4 px-4">
                                {/* Reviewed by */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image
                                            src={review.user.profilePicture || "/noAvatar.png"}
                                            alt={review.user.username}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <p className="text-gray-400 text-sm">
                                            Reviewed by{" "}
                                            <Link 
                                                href={`/${review.user.username}`}
                                                className="font-semibold text-white hover:text-green-400 transition-colors"
                                            >
                                                {review.user.username}
                                            </Link>
                                        </p>
                                    </div>
                                </div>

                                {/* User's Rating and Favorite Status */}
                                <div className="space-y-2">
                                    {/* First row: Rating and Rose (if both exist) */}
                                    {(review.userRating || review.userFavorite) && (
                                        <div className="flex items-center gap-4">
                                            {review.userRating && (
                                                <div className="flex items-center gap-1">
                                                    <FiStar className="w-5 h-5 text-yellow-400 fill-current" />
                                                    <span className="text-lg font-semibold text-yellow-400">
                                                        {review.userRating}
                                                    </span>
                                                    <span className="text-sm text-gray-400">/ 5</span>
                                                </div>
                                            )}
                                            {review.userFavorite && (
                                                <div className="flex items-center gap-1">
                                                    <GiRose className="w-5 h-5 text-red-400 fill-current" />
                                                    <span className="text-sm text-red-400 font-medium pl-1">Reviewer gave this a rose</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Second row: Spoiler (if exists) */}
                                    {review.spoiler && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-red-400 text-sm font-medium">⚠️ SPOILER</span>
                                        </div>
                                    )}
                                </div>

                                {/* Date Fields */}
                                <div className="mb-4">
                                    {reviewType !== "episode" ? (
                                        <div className="space-y-2">
                                            {review.startedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Started watching on:</span>{" "}
                                                    {format(review.startedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                            {review.endedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Ended watching on:</span>{" "}
                                                    {format(review.endedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        review.watchedOn && (
                                            <p className="text-sm">
                                                <span className="text-gray-400">Watched on:</span>{" "}
                                                {format(new Date(review.watchedOn), "MMM d, yyyy")}
                                            </p>
                                        )
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <GiRose className="w-4 h-4 text-red-400 fill-current" />
                                        <span>{likeCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiMessageCircle className="w-4 h-4" />
                                        <span>{review._count.comments || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex flex-row gap-6 mb-8">
                            {/* Poster */}
                            <div className="flex-shrink-0">
                                <Link href={getEntityLink()}>
                                    <Image
                                        src={getDesktopPosterPath() ? `https://image.tmdb.org/t/p/w500${getDesktopPosterPath()}` : "/noPoster.jpg"}
                                        alt={getEntityName()}
                                        width={200}
                                        height={300}
                                        className="rounded-lg object-cover hover:opacity-80 transition-opacity"
                                    />
                                </Link>
                            </div>

                            {/* Entity Info */}
                            <div className="flex-grow">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image
                                            src={review.user.profilePicture || "/noAvatar.png"}
                                            alt={review.user.username}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <p className="text-gray-400 text-sm">
                                            Reviewed by{" "}
                                            <Link 
                                                href={`/${review.user.username}`}
                                                className="font-semibold text-white hover:text-green-400 transition-colors"
                                            >
                                                {review.user.username}
                                            </Link>
                                        </p>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                        <Link 
                                            href={getEntityLink()}
                                            className="hover:text-green-400 transition-colors"
                                        >
                                            {getEntityName()}
                                        </Link>
                                    </h1>
                                    {getAirDate() && (
                                        <p className="text-gray-400">
                                            Aired on {format(getAirDate()!, "MMMM d, yyyy")}
                                        </p>
                                    )}
                                </div>

                                {/* User's Rating and Favorite Status */}
                                <div className="mb-4 flex items-center gap-4">
                                    {review.userRating && (
                                        <div className="flex items-center gap-1">
                                            <FiStar className="w-5 h-5 text-yellow-400 fill-current" />
                                            <span className="text-lg font-semibold text-yellow-400">
                                                {review.userRating}
                                            </span>
                                            <span className="text-sm text-gray-400">/ 5</span>
                                        </div>
                                    )}
                                    {review.userFavorite && (
                                        <div className="flex items-center gap-1">
                                            <GiRose className="w-5 h-5 text-red-400 fill-current" />
                                            <span className="text-sm text-red-400 font-medium pl-1">Reviewer gave this a rose</span>
                                        </div>
                                    )}
                                    {review.spoiler && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-red-400 text-sm font-medium">⚠️ SPOILER</span>
                                        </div>
                                    )}
                                </div>

                                {/* Date Fields */}
                                <div className="mb-4">
                                    {reviewType !== "episode" ? (
                                        <div className="space-y-2">
                                            {review.startedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Started watching on:</span>{" "}
                                                    {format(review.startedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                            {review.endedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Ended watching on:</span>{" "}
                                                    {format(review.endedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        review.watchedOn && (
                                            <p className="text-sm">
                                                <span className="text-gray-400">Watched on:</span>{" "}
                                                {format(new Date(review.watchedOn), "MMM d, yyyy")}
                                            </p>
                                        )
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <GiRose className="w-4 h-4 text-red-400 fill-current" />
                                        <span>{likeCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiMessageCircle className="w-4 h-4" />
                                        <span>{review._count.comments || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Review Content */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-green-500 mb-4">Review</h2>
                            <div className="border-b border-gray-600 mb-4"></div>
                            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {review.content}
                            </p>
                        </div>

                        {/* Like Button */}
                        <div className="mb-6">
                            <LikeButton
                                entityType={`${reviewType}Review`}
                                entityId={review.id}
                                initialIsLiked={review.likes?.length > 0}
                                size="lg"
                                onLikeChange={(isLiked) => {
                                    setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
                                }}
                            />
                        </div>

                        {/* Tags */}
                        {review.tags && review.tags.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-green-500 mb-4 flex items-center gap-2">
                                    <FiTag className="text-green-400" />
                                    Tags
                                </h3>
                                <div className="border-b border-gray-600 mb-4"></div>
                                <div className="flex flex-wrap gap-2">
                                    {review.tags.map((tagRelation) => (
                                        <span
                                            key={tagRelation.tag.id}
                                            className="px-3 py-1 bg-green-600 text-white rounded-full text-sm"
                                        >
                                            {tagRelation.tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Favourite Characters (Show and Season only) */}
                        {reviewType !== "episode" && getFavouriteCharacters() && getFavouriteCharacters()!.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-green-500 mb-4 flex items-center gap-2">
                                    <FiUser className="text-green-400" />
                                    Favourite &apos;Characters&apos;
                                </h3>
                                <div className="border-b border-gray-600 mb-4"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {getFavouriteCharacters()!.map((character) => (
                                        <div
                                            key={character.id}
                                            className="flex items-center gap-3 py-3 border-b border-gray-700"
                                        >
                                            <Image
                                                src={character.person?.profilePath ? `https://image.tmdb.org/t/p/w500${character.person.profilePath}` : "/noAvatar.png"}
                                                alt={character.person?.name || "Unknown"}
                                                width={40}
                                                height={40}
                                                className="rounded-md object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-white">{character.person?.name || "Unknown"}</p>
                                                {character.showRole && (
                                                    <p className="text-sm text-gray-400">
                                                        as {character.showRole}
                                                    </p>
                                                )}
                                                {reviewType === "show" && character.season && (
                                                    <p className="text-sm text-gray-500">
                                                        Season {character.season.seasonNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <Comments
                            entityType="review"
                            entityId={review.id}
                            comments={comments}
                            onCommentAdded={(comment) => {
                                setComments(prev => [comment, ...prev]);
                            }}
                            reviewType={reviewType}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 