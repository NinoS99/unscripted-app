import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import ShowActionButtons from "@/components/ShowActionButtons";
import WatchedStatusDisplay from "@/components/WatchedStatusDisplay";
import CompletionReviewPrompt from "@/components/CompletionReviewPrompt";

import EpisodesOfSeason from "@/components/EpisodesOfSeason";
import SeasonReviewButton from "@/components/SeasonReviewButton";
import StartDiscussionButton from "@/components/StartDiscussionButton";
import EntityReviews from "@/components/EntityReviews";
import EntityDiscussions from "@/components/EntityDiscussions";
import RatingDistributionChart from "@/components/RatingDistributionChart";
import SeasonNavigation from "@/components/SeasonNavigation";
import { format } from "date-fns";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function SeasonPage({
    params,
}: {
    params: Promise<{ showId: number; seasonNumber: string }>;
}) {
    const { showId, seasonNumber } = await params;
    const seasonNum = parseInt(seasonNumber);
    const { userId } = await auth();

    const season = await prisma.season.findUnique({
        where: {
            showId_seasonNumber: {
                showId: Number(showId),
                seasonNumber: seasonNum,
            },
        },
        include: {
            show: {
                select: {
                    id: true,
                    name: true,
                    posterPath: true,
                    backdropPath: true,
                    firstAirDate: true,
                    creator: {
                        include: { creator: true },
                    },
                },
            },
            episodes: {
                orderBy: { episodeNumber: "asc" },
            },
            characters: {
                include: {
                    person: true,
                },
            },
            seasonReviews: {
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

    if (!season) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl">Season not found</p>
            </div>
        );
    }

    const formatDate = (date: Date | null) =>
        date ? format(date, "MMMM d, yyyy") : "Unknown";

    const episodesWithFormattedDates = season.episodes.map((episode) => ({
        id: episode.id,
        episodeNumber: episode.episodeNumber,
        name: episode.name,
        overview: episode.overview || undefined, // Convert null to undefined
        formattedAirDate: formatDate(episode.airDate),
        tmdbRating: episode.tmdbRating || undefined,
        stillPath: episode.stillPath || undefined,
    }));

    // Calculate statistics
    const totalReviews = season.seasonReviews.length;
    const totalWatched = season.watched.length; // Count of users who watched
    const totalLikes = season.favorites.length; // Count of favorites from users
    const totalRatings = season.ratings.length;
    
    // Fetch discussion count for this season
    const totalDiscussions = await prisma.discussion.count({
        where: {
            seasonId: season.id,
        },
    });
    const averageRating =
        totalRatings > 0
            ? (
                  season.ratings.reduce(
                      (sum, rating) => sum + rating.rating,
                      0
                  ) / totalRatings
              ).toFixed(1)
            : "No ratings";

    // Calculate rating distribution
    const ratingDistribution = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(
        (rating) => {
            const count = season.ratings.filter(
                (r) => r.rating === rating
            ).length;
            const percentage =
                totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            return { rating, count, percentage };
        }
    );

    // Get user's rating and favorite status for this season
    let userRating;
    let userFavorite;
    if (userId) {
        userRating = await prisma.rating.findUnique({
            where: {
                userId_seasonId: {
                    userId,
                    seasonId: season.id,
                },
            },
        });
        userFavorite = await prisma.favorite.findFirst({
            where: {
                userId,
                seasonId: season.id,
            },
        });
    }

    return (
        <div className="min-h-screen bg-gray-900 container mx-auto">
            {/* Desktop Cover Photo - Using show backdrop */}
            <div className="relative h-96 md:h-[32rem] w-full overflow-hidden hidden md:block">
                {season.show.backdropPath ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/w1280${season.show.backdropPath}`}
                        alt={`${season.show.name} backdrop`}
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
                            {season.show.name}
                        </h1>
                    </Link>
                    <h2 className="text-2xl font-bold text-green-400 mb-1">
                        {season.seasonNumber === 0
                            ? "Specials"
                            : `Season ${season.seasonNumber}`}
                    </h2>
                    <div className="flex flex-col gap-1 text-sm text-gray-200">
                        {season.airDate && (
                            <p>
                                {new Date(season.airDate) > new Date()
                                    ? "Airing on"
                                    : "Aired on"}{" "}
                                {formatDate(season.airDate)}
                            </p>
                        )}
                        {season.show.creator.length > 0 && (
                            <p>
                                Created by{" "}
                                {season.show.creator
                                    .map((c) => c.creator.name)
                                    .join(", ")}
                            </p>
                        )}
                        <WatchedStatusDisplay
                            entityType="season"
                            entityId={season.id}
                        />
                    </div>
                </div>

                {/* Season Navigation */}
                <SeasonNavigation
                    showId={showId}
                    currentSeasonNumber={season.seasonNumber}
                />
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
                {/* Poster with full-width */}
                <div
                    className="relative w-full"
                    style={{ height: "auto", aspectRatio: "2/3" }}
                >
                    {season.posterPath || season.show.posterPath ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w780${
                                season.posterPath || season.show.posterPath
                            }`}
                            alt={`${season.show.name} ${
                                season.seasonNumber === 0
                                    ? "Specials"
                                    : `Season ${season.seasonNumber}`
                            } poster`}
                            width={780}
                            height={1170}
                            className="w-full h-auto object-cover"
                            priority
                            quality={90}
                        />
                    ) : (
                        <div
                            className="w-full"
                            style={{
                                aspectRatio: "2/3",
                                backgroundColor: "#1f2937",
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white">
                                    No poster available
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Overlayed Text Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <Link href={`/show/${showId}`}>
                            <h1 className="text-2xl font-bold text-white mb-1 hover:text-green-400 transition-colors">
                                {season.show.name}
                            </h1>
                        </Link>
                        <h2 className="text-xl font-bold text-green-400">
                            {season.seasonNumber === 0
                                ? "Specials"
                                : `Season ${season.seasonNumber}`}
                        </h2>
                        <div className="flex flex-col gap-1 text-sm text-gray-200">
                            {season.airDate && (
                                <p>
                                    {new Date(season.airDate) > new Date()
                                        ? "Airing on"
                                        : "Aired on"}{" "}
                                    {formatDate(season.airDate)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Season Navigation - Mobile */}
                    <SeasonNavigation
                        showId={showId}
                        currentSeasonNumber={season.seasonNumber}
                    />
                </div>
            </div>

            <div className="container mx-auto px-4 py-2 md:px-8 md:py-8 bg-gray-900">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Left Column */}
                    <div className="flex-shrink-0 w-full md:w-64">
                        {/* Season Poster Image (hidden on mobile) */}
                        <div className="hidden md:block relative w-full h-96 md:h-[24rem] rounded-lg overflow-hidden shadow-lg">
                            <Image
                                src={
                                    season.posterPath || season.show.posterPath
                                        ? `https://image.tmdb.org/t/p/w500${
                                              season.posterPath ||
                                              season.show.posterPath
                                          }`
                                        : "/noPoster.jpg"
                                }
                                alt={`${season.show.name} ${
                                    season.seasonNumber === 0
                                        ? "Specials"
                                        : `Season ${season.seasonNumber}`
                                } poster`}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Mobile: Add padding to match ratings section */}
                        <div className="md:p-0 p-6">
                            <ShowActionButtons
                            showId={showId}
                            entityType="season"
                            entityId={season.id}
                            userId={userId}
                            initialTotalWatched={totalWatched}
                            initialTotalLikes={totalLikes}
                            initialTotalReviews={totalReviews}
                            initialTotalDiscussions={totalDiscussions}
                            showIdForRedirect={showId}
                        />

                        {userId && (
                            <SeasonReviewButton
                                season={{
                                    id: season.id,
                                    seasonNumber: season.seasonNumber,
                                    airDate: season.airDate,
                                    posterPath: season.posterPath,
                                    show: {
                                        id: showId,
                                        name: season.show.name,
                                        posterPath: season.show.posterPath,
                                    },
                                    characters: season.characters.map(
                                        (char) => ({
                                            id: char.id,
                                            name: char.person.name,
                                            characterName: char.showRole,
                                            profilePath:
                                                char.person.profilePath,
                                        })
                                    ),
                                }}
                            />
                        )}

                        {/* Start Discussion Button */}
                        <div className="mt-2">
                            <StartDiscussionButton
                                entityType="season"
                                entityId={season.id}
                                entityName={`${season.show.name} - ${
                                    season.seasonNumber === 0
                                        ? "Specials"
                                        : `Season ${season.seasonNumber}`
                                }`}
                                entityData={{
                                    rating: userRating?.rating,
                                    isFavorited: !!userFavorite,
                                }}
                            />
                        </div>

                        {/* Discussions Section - Desktop Only */}
                        <div className="hidden md:block">
                            <EntityDiscussions
                                entityType="season"
                                entityId={season.id}
                            />
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
                                    entityType="season"
                                />

                                {season.overview && (
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-green-500 mb-3">
                                            Season Overview
                                        </h2>
                                        <div className="border-b border-gray-600 mb-4"></div>
                                        <p className="text-white whitespace-pre-line">
                                            {season.overview}
                                        </p>
                                    </div>
                                )}

                                {/* Episodes Section */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-green-500 mb-4">
                                        Episodes
                                    </h2>
                                    <div className="border-b border-gray-600 mb-4"></div>
                                    <EpisodesOfSeason
                                        episodes={episodesWithFormattedDates}
                                        seasonNumber={season.seasonNumber}
                                        characters={season.characters}
                                        showId={showId}
                                    />
                                </div>

                                {/* Reviews Section */}
                                <EntityReviews
                                    entityType="season"
                                    entityId={season.id}
                                    entityName={`${season.show.name} - ${
                                        season.seasonNumber === 0
                                            ? "Specials"
                                            : `Season ${season.seasonNumber}`
                                    }`}
                                />

                                {/* Discussions Section - Mobile */}
                                <div className="md:hidden mb-8">
                                    <EntityDiscussions
                                        entityType="season"
                                        entityId={season.id}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CompletionReviewPrompt
                entityType="season"
                entityId={season.id}
                entityName={`${season.show.name} - Season ${season.seasonNumber}`}
                showId={showId}
                seasonNumber={season.seasonNumber}
            />

            <CompletionReviewPrompt
                entityType="show"
                entityId={showId}
                entityName={season.show.name}
            />
        </div>
    );
}
