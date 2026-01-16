import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import ShowActionButtons from "@/components/ShowActionButtons";
import WatchedStatusDisplay from "@/components/WatchedStatusDisplay";
import EpisodeReviewButton from "@/components/EpisodeReviewButton";
import StartDiscussionButton from "@/components/StartDiscussionButton";
import EntityReviews from "@/components/EntityReviews";
import EntityDiscussions from "@/components/EntityDiscussions";
import RatingDistributionChart from "@/components/RatingDistributionChart";
import CompletionReviewPrompt from "@/components/CompletionReviewPrompt";

import EpisodeNavigation from "@/components/EpisodeNavigation";
import { format } from "date-fns";
import Link from "next/link";
import prisma from "@/lib/client";

export default async function EpisodePage({
    params,
}: {
    params: Promise<{
        showId: string;
        seasonNumber: string;
        episodeNumber: string;
    }>;
}) {
    const { showId, seasonNumber, episodeNumber } = await params;
    const { userId } = await auth();

    const episode = await prisma.episode.findFirst({
        where: {
            season: {
                showId: Number(showId),
                seasonNumber: Number(seasonNumber),
            },
            episodeNumber: Number(episodeNumber),
        },
        include: {
            season: {
                include: {
                    show: {
                        select: {
                            name: true,
                            posterPath: true,
                            backdropPath: true,
                            firstAirDate: true,
                            creator: {
                                include: { creator: true },
                            },
                        },
                    },
                },
            },
            episodeReviews: {
                include: {
                    _count: {
                        select: {
                            likes: true,
                        },
                    },
                },
            },
            favorites: true,
            ratings: true,
            watched: true,
        },
    });

    if (!episode) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl">Episode not found</p>
            </div>
        );
    }

    const formatDate = (date: Date | null) =>
        date ? format(date, "MMMM d, yyyy") : "Unknown";

    // Determine which image to use with fallbacks
    const stillPath =
        episode.stillPath ||
        episode.season.posterPath ||
        episode.season.show.posterPath;

    const desktopStillPath =
        episode.season.posterPath || episode.season.show.posterPath;

    const desktopBackdropPath = episode.stillPath || episode.season.show.backdropPath;

    // Calculate statistics
    const totalReviews = episode.episodeReviews.length;
    const totalWatched = episode.watched.length; // Count of users who watched
    const totalLikes = episode.favorites.length; // Count of favorites from users
    const totalRatings = episode.ratings.length;
    
    // Fetch discussion count for this episode
    const totalDiscussions = await prisma.discussion.count({
        where: {
            episodeId: episode.id,
        },
    });
    const averageRating = totalRatings > 0 
        ? (episode.ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings).toFixed(1)
        : "No ratings";

    // Calculate rating distribution
    const ratingDistribution = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(rating => {
        const count = episode.ratings.filter(r => r.rating === rating).length;
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
        return { rating, count, percentage };
    });

    // Get user's rating and favorite status for this episode
    let userRating;
    let userFavorite;
    if (userId) {
        userRating = await prisma.rating.findUnique({
            where: {
                userId_episodeId: {
                    userId,
                    episodeId: episode.id,
                },
            },
        });
        userFavorite = await prisma.favorite.findFirst({
            where: {
                userId,
                episodeId: episode.id,
            },
        });
    }



    return (
        <div className="min-h-screen bg-gray-900 container mx-auto">


            {/* Desktop Cover Photo */}
            <div className="relative h-96 md:h-[32rem] w-full overflow-hidden hidden md:block">
                {episode.season.show.backdropPath ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/w1280${desktopBackdropPath}`}
                        alt={`${episode.season.show.name} backdrop`}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800"></div>
                )}

                {/* Desktop Title Box */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <Link href={`/show/${showId}`}>
                        <h1 className="text-3xl font-bold text-white mb-1 hover:text-green-400 transition-colors">
                            {episode.season.show.name}
                        </h1>
                    </Link>
                    <Link href={`/show/${showId}/season/${seasonNumber}`}>
                        <h2 className="text-2xl font-bold text-green-400 mb-1 hover:text-green-300">
                            {episode.season.seasonNumber === 0
                                ? "Specials"
                                : `Season ${episode.season.seasonNumber}`}
                        </h2>
                    </Link>
                    <h3 className="text-xl font-bold text-white">
                        {episode.episodeNumber}: {episode.name}
                    </h3>
                    <div className="flex flex-col gap-1 text-sm text-gray-200">
                        {episode.airDate && (
                            <p>
                                {new Date(episode.airDate) > new Date() ? "Airing on" : "Aired on"}{" "}
                                {formatDate(episode.airDate)}
                            </p>
                        )}
                        {episode.season.show.creator.length > 0 && (
                            <p>
                                Created by{" "}
                                {episode.season.show.creator
                                    .map((c) => c.creator.name)
                                    .join(", ")}
                            </p>
                        )}
                        <WatchedStatusDisplay entityType="episode" entityId={episode.id} />
                    </div>

                    {/* Episode Navigation */}
                    <EpisodeNavigation 
                        showId={Number(showId)} 
                        currentSeasonNumber={episode.season.seasonNumber} 
                        currentEpisodeNumber={episode.episodeNumber} 
                    />
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
                {/* Still image with full-width */}
                <div
                    className="relative w-full"
                    style={{ height: "auto", aspectRatio: "16/9" }}
                >
                    {stillPath ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w780${stillPath}`}
                            alt={`${episode.season.show.name} - ${episode.name}`}
                            width={780}
                            height={439} // 16:9 aspect ratio
                            className="w-full h-auto object-cover"
                            priority
                            quality={90}
                        />
                    ) : (
                        <div
                            className="w-full"
                            style={{
                                aspectRatio: "16/9",
                                backgroundColor: "#1f2937",
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white">
                                    No image available
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Overlayed Text Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <Link href={`/show/${showId}`}>
                            <h1 className="text-xl font-bold text-white mb-1 hover:text-green-400 transition-colors">
                                {episode.season.show.name}
                            </h1>
                        </Link>
                        <Link href={`/show/${showId}/season/${seasonNumber}`}>
                            <h2 className="text-lg font-bold text-green-400 hover:text-green-300">
                                {episode.season.seasonNumber === 0
                                    ? "Specials"
                                    : `Season ${episode.season.seasonNumber}`}
                            </h2>
                        </Link>
                        <h3 className="text-md font-bold text-white">
                            Episode {episode.episodeNumber}: {episode.name}
                        </h3>
                        <div className="flex flex-col gap-1 text-sm text-gray-200">
                            {episode.airDate && (
                                <p>
                                    {new Date(episode.airDate) > new Date() ? "Airing on" : "Aired on"}{" "}
                                    {formatDate(episode.airDate)}
                                </p>
                            )}
                        </div>
                        <WatchedStatusDisplay entityType="episode" entityId={episode.id} />
                    </div>

                    {/* Episode Navigation - Mobile */}
                    <EpisodeNavigation 
                        showId={Number(showId)} 
                        currentSeasonNumber={episode.season.seasonNumber} 
                        currentEpisodeNumber={episode.episodeNumber} 
                    />
                </div>
            </div>

            <div className="container mx-auto px-4 py-2 md:px-8 md:py-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Left Column */}
                    <div className="flex-shrink-0 w-full md:w-64">
                        {/* Episode Still Image (hidden on mobile) */}
                        <div className="hidden md:block relative w-full h-96 md:h-[24rem] rounded-lg overflow-hidden shadow-lg">
                            <Image
                                src={
                                    stillPath
                                        ? `https://image.tmdb.org/t/p/w500${desktopStillPath}`
                                        : "/noPoster.jpg"
                                }
                                alt={`${episode.season.show.name} - ${episode.name}`}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Mobile: Add padding to match ratings section */}
                        <div className="md:p-0 p-6">
                            <ShowActionButtons
                            showId={Number(showId)}
                            entityType="episode"
                            entityId={episode.id}
                            userId={userId}
                            initialTotalWatched={totalWatched}
                            initialTotalLikes={totalLikes}
                            initialTotalReviews={totalReviews}
                            initialTotalDiscussions={totalDiscussions}
                            showIdForRedirect={Number(showId)}
                            seasonId={episode.season.id}
                            episodeId={episode.id}
                        />
                            
                        {userId && (
                            <EpisodeReviewButton 
                                episode={{
                                    id: episode.id,
                                    episodeNumber: episode.episodeNumber,
                                    name: episode.name,
                                    overview: episode.overview,
                                    airDate: episode.airDate,
                                    stillPath: episode.stillPath,
                                    season: {
                                        id: episode.season.id,
                                        seasonNumber: episode.season.seasonNumber,
                                        posterPath: episode.season.posterPath,
                                        show: {
                                            id: Number(showId),
                                            name: episode.season.show.name,
                                            posterPath: episode.season.show.posterPath
                                        }
                                    }
                                }}
                            />
                        )}

                        {/* Start Discussion Button */}
                        <div className="mt-2">
                            <StartDiscussionButton
                                entityType="episode"
                                entityId={episode.id}
                                entityName={`${episode.season.show.name} - ${episode.season.seasonNumber === 0 ? "S" : `S${episode.season.seasonNumber}E`}${episode.episodeNumber} - ${episode.name}`}
                                entityData={{
                                    rating: userRating?.rating,
                                    isFavorited: !!userFavorite
                                }}
                            />
                        </div>

                        {/* Discussions Section - Desktop Only */}
                        <div className="hidden md:block">
                            <EntityDiscussions entityType="episode" entityId={episode.id} />
                        </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-grow min-w-0">
                        <div className="rounded-lg shadow overflow-hidden h-full flex flex-col">
                            <div className="overflow-y-auto p-6 flex-grow">
                                {/* Rating Distribution Chart */}
                                <RatingDistributionChart 
                                    averageRating={averageRating}
                                    totalRatings={totalRatings}
                                    ratingDistribution={ratingDistribution}
                                    entityType="episode"
                                />

                                {episode.overview && (
                                    <div className="mb-5">
                                        <h2 className="text-xl font-semibold text-green-500 mb-3">
                                            Episode Overview
                                        </h2>
                                        <div className="border-b border-gray-600 mb-4"></div>
                                        <p className="text-white whitespace-pre-line">
                                            {episode.overview}
                                        </p>
                                    </div>
                                )}


                                {/* Reviews Section */}
                                <EntityReviews
                                    entityType="episode"
                                    entityId={episode.id}
                                    entityName={`${episode.season.show.name} - ${episode.season.seasonNumber === 0 ? "S" : `S${episode.season.seasonNumber}E`}${episode.episodeNumber} - ${episode.name}`}
                                />

                                {/* Discussions Section - Mobile */}
                                <div className="md:hidden mb-8">
                                    <EntityDiscussions entityType="episode" entityId={episode.id} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <CompletionReviewPrompt
                entityType="season"
                entityId={episode.season.id}
                entityName={`${episode.season.show.name} - ${episode.season.seasonNumber === 0 ? "Specials" : "Season " + episode.season.seasonNumber}`}
                showId={Number(showId)}
                seasonNumber={episode.season.seasonNumber}
            />
            
            <CompletionReviewPrompt
                entityType="show"
                entityId={Number(showId)}
                entityName={episode.season.show.name}
            />
        </div>
    );
}
