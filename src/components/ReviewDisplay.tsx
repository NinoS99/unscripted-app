"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { FiTag, FiUser } from "react-icons/fi";
import LikeButton from "./LikeButton";
import ReviewComments from "./ReviewComments";

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
            user: {
                id: string;
                username: string;
                profilePicture: string | null;
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
                };
            }>;
            likes: Array<{ id: number }>;
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
    const getEntityName = () => {
        switch (reviewType) {
            case "show":
                return entity?.name || "Unknown Show";
            case "season":
                return `${entity?.show?.name || "Unknown Show"} - Season ${entity?.seasonNumber}`;
            case "episode":
                return `${entity?.season?.show?.name || "Unknown Show"} - S${entity?.season?.seasonNumber}E${entity?.episodeNumber} - ${entity?.name || "Unknown Episode"}`;
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
                return entity?.posterPath;
            case "episode":
                // Priority order: episode still → season poster → show poster
                return availableImages?.episodeStillPath || 
                       availableImages?.seasonPosterPath || 
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
        return review?.favouriteCharacters?.map((fc) => fc.character) || [];
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
                                    <p className="text-green-400 text-sm mb-2">
                                        Reviewed by{" "}
                                        <span className="font-semibold">
                                            {review?.user?.username}
                                        </span>
                                    </p>
                                </div>

                                {/* User's Rating */}
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">User&apos;s Rating</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-green-400">
                                            {review.userRating || "Not rated"}
                                        </span>
                                        {review.userRating && (
                                            <span className="text-sm text-gray-400">/ 5</span>
                                        )}
                                    </div>
                                </div>

                                {/* Date Fields */}
                                <div>
                                    {reviewType !== "episode" ? (
                                        <div className="space-y-2">
                                            {review?.startedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Started watching on:</span>{" "}
                                                    {format(review.startedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                            {review?.endedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Ended watching on:</span>{" "}
                                                    {format(review.endedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        review?.watchedOn && (
                                            <p className="text-sm">
                                                <span className="text-gray-400">Watched on:</span>{" "}
                                                {format(new Date(review.watchedOn), "MMM d, yyyy")}
                                            </p>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex flex-row gap-6 mb-8">
                            {/* Poster */}
                            <div className="flex-shrink-0">
                                <Link href={getEntityLink()}>
                                    <Image
                                        src={getPosterPath() ? `https://image.tmdb.org/t/p/w500${getPosterPath()}` : "/noPoster.jpg"}
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
                                    <p className="text-green-400 text-sm mb-2">
                                        Reviewed by{" "}
                                        <span className="font-semibold">
                                            {review?.user?.username}
                                        </span>
                                    </p>
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

                                {/* User's Rating */}
                                <div className="mb-4">
                                    <p className="text-sm text-gray-400 mb-2">User&apos;s Rating</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-green-400">
                                            {review.userRating || "Not rated"}
                                        </span>
                                        {review.userRating && (
                                            <span className="text-sm text-gray-400">/ 5</span>
                                        )}
                                    </div>
                                </div>

                                {/* Date Fields */}
                                <div className="mb-4">
                                    {reviewType !== "episode" ? (
                                        <div className="space-y-2">
                                            {review?.startedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Started watching on:</span>{" "}
                                                    {format(review.startedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                            {review?.endedOn && (
                                                <p className="text-sm">
                                                    <span className="text-gray-400">Ended watching on:</span>{" "}
                                                    {format(review.endedOn, "MMM d, yyyy")}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        review?.watchedOn && (
                                            <p className="text-sm">
                                                <span className="text-gray-400">Watched on:</span>{" "}
                                                {format(new Date(review.watchedOn), "MMM d, yyyy")}
                                            </p>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Review Content */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Review</h2>
                            <div className="bg-gray-800 rounded-lg p-6">
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {review?.content}
                                </p>
                            </div>
                        </div>

                        {/* Like Button */}
                        <div className="mb-6">
                            <LikeButton
                                entityType={`${reviewType}Review`}
                                entityId={review?.id}
                                initialLikeCount={review?._count?.likes || 0}
                                initialIsLiked={review?.likes?.length > 0}
                                size="lg"
                            />
                        </div>

                        {/* Tags */}
                        {review?.tags && review.tags.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FiTag className="text-green-400" />
                                    Tags
                                </h3>
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
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FiUser className="text-green-400" />
                                    Favourite Characters
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {getFavouriteCharacters()!.map((character) => (
                                        <div
                                            key={character.id}
                                            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
                                        >
                                            <Image
                                                src={character.person?.profilePath ? `https://image.tmdb.org/t/p/w500${character.person.profilePath}` : "/noAvatar.png"}
                                                alt={character.person?.name || "Unknown"}
                                                width={40}
                                                height={40}
                                                className="rounded-md object-cover"
                                            />
                                            <div>
                                                <p className="font-medium">{character.person?.name || "Unknown"}</p>
                                                {character.showRole && (
                                                    <p className="text-sm text-gray-400">
                                                        as {character.showRole}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <ReviewComments
                            reviewType={reviewType}
                            reviewId={review?.id}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 