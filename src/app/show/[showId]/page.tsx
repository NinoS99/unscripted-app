import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import ShowActionButtons from "../../../components/ShowActionButtons";
import WatchedStatusDisplay from "../../../components/WatchedStatusDisplay";
import CompletionReviewPrompt from "../../../components/CompletionReviewPrompt";

import ShowReviewButton from "../../../components/ReviewButton";
import SeasonEpisodesOfShow from "../../../components/SeasonEpisodesOfShow";
import EntityReviews from "../../../components/EntityReviews";
import RatingDistributionChart from "../../../components/RatingDistributionChart";
import AddToWatchListButton from "../../../components/AddToWatchListButton";
import StartDiscussionButton from "../../../components/StartDiscussionButton";
import EntityDiscussions from "../../../components/EntityDiscussions";
import { FiMessageCircle } from "react-icons/fi";
import { GiRose } from "react-icons/gi";
import { format } from "date-fns";

const prisma = new PrismaClient();

export default async function ShowPage({
    params,
}: {
    params: Promise<{ showId: string }>;
}) {
    const { showId } = await params;
    const { userId } = await auth();

    // Fetch user-specific data for the show
    let userRating = null;
    let userFavorite = null;
    
    if (userId) {
        userRating = await prisma.rating.findUnique({
            where: {
                userId_showId: {
                    userId,
                    showId: Number(showId)
                }
            }
        });
        
        userFavorite = await prisma.favorite.findFirst({
            where: {
                userId,
                showId: Number(showId)
            }
        });
    }

    const show = await prisma.show.findUnique({
        where: { id: Number(showId) },
        include: {
            creator: { include: { creator: true } },
            ShowsOnNetworks: { include: { network: true } },

            seasons: {
                orderBy: { seasonNumber: "asc" },
                include: {
                    episodes: {
                        orderBy: { episodeNumber: "asc" },
                        select: {
                            id: true,
                            episodeNumber: true,
                            name: true,
                            overview: true,
                            airDate: true,
                        },
                    },
                    characters: {
                        include: {
                            person: true,
                        },
                    },
                },
            },
            showReviews: {
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

    // Fetch watch lists containing this show
    const watchListsWithShow = await prisma.watchList.findMany({
        where: {
            shows: {
                some: {
                    showId: Number(showId),
                },
            },
            isPublic: true,
        },
        include: {
            user: {
                select: {
                    username: true,
                },
            },
                         shows: {
                 include: {
                     show: {
                         select: {
                             posterPath: true,
                         },
                     },
                 },
                 orderBy: {
                     ranking: "asc",
                 },
             },
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 10, // Fetch more to sort by popularity
    });

    // Sort by popularity (likes + comments) and take top 5
    const sortedWatchLists = watchListsWithShow
        .sort((a, b) => {
            const aPopularity = a._count.likes + a._count.comments;
            const bPopularity = b._count.likes + b._count.comments;
            return bPopularity - aPopularity; // Most popular first
        })
        .slice(0, 4);

    if (!show) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl">Show not found</p>
            </div>
        );
    }

    const formatDate = (date: Date | null) =>
        date
            ? format(date, "MMMM d, yyyy") // Or toLocaleDateString w/ options
            : null;

    const seasonsWithFormattedDates = show.seasons.map((season) => ({
        ...season,
        episodes: season.episodes.map((ep) => ({
            ...ep,
            formattedAirDate: formatDate(ep.airDate),
        })),
    }));

    // Calculate statistics
    const totalReviews = show.showReviews.length;
    const totalWatched = show.watched.length; // Count of users who watched
    const totalLikes = show.favorites.length; // Count of favorites from users
    const totalRatings = show.ratings.length;
    const averageRating =
        totalRatings > 0
            ? (
                  show.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
                  totalRatings
              ).toFixed(1)
            : "No ratings";

    // Calculate rating distribution
    const ratingDistribution = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(
        (rating) => {
            const count = show.ratings.filter(
                (r) => r.rating === rating
            ).length;
            const percentage =
                totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            return { rating, count, percentage };
        }
    );

    return (
        <div className="min-h-screen bg-gray-900 container mx-auto">
            {/* Desktop Cover Photo */}
            <div className="relative h-96 md:h-[32rem] w-full overflow-hidden hidden md:block">
                {show.backdropPath ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/w1280${show.backdropPath}`}
                        alt={`${show.name} backdrop`}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800"></div>
                )}

                {/* Desktop Title Box */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {show.name}
                    </h1>
                    <div className="flex flex-col gap-1 text-sm text-gray-200">
                        {show.firstAirDate && (
                            <p>
                                First aired on {formatDate(show.firstAirDate)}
                            </p>
                        )}
                        {show.creator.length > 0 && (
                            <p>
                                Created by{" "}
                                {show.creator
                                    .map((c) => c.creator.name)
                                    .join(", ")}
                            </p>
                        )}
                        <WatchedStatusDisplay
                            entityType="show"
                            entityId={show.id}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
                {/* Poster with full-width and high resolution */}
                <div
                    className="relative w-full"
                    style={{ height: "auto", aspectRatio: "2/3" }}
                >
                    {show.posterPath ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w780${show.posterPath}`}
                            alt={`${show.name} poster`}
                            width={780} // Optimal mobile width
                            height={1170} // Maintains 2:3 aspect ratio
                            className="w-full h-auto object-cover"
                            priority
                            quality={90} // Higher quality
                            style={{
                                borderBottom: "0px solid",
                                borderTop: "0px solid",
                            }}
                        />
                    ) : (
                        <div
                            className="w-full"
                            style={{
                                aspectRatio: "2/3",
                                backgroundColor: "#1f2937", // gray-800
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white">
                                    No poster available
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Overlayed Text Info (unchanged) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        {/* ... existing title info ... */}
                        <h1 className="text-2xl font-bold text-white mb-1">
                            {show.name}
                        </h1>
                        <div className="flex flex-col gap-1 text-sm text-gray-200">
                            {show.firstAirDate && (
                                <p>
                                    First aired on{" "}
                                    {formatDate(show.firstAirDate)}
                                </p>
                            )}
                            {show.creator.length > 0 && (
                                <p>
                                    Created by{" "}
                                    {show.creator
                                        .map((c) => c.creator.name)
                                        .join(", ")}
                                </p>
                            )}
                            <WatchedStatusDisplay
                                entityType="show"
                                entityId={show.id}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-2 md:px-8 md:py-8 bg-gray-900">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Left Column - Same as before but adjusted for mobile */}
                    <div className="flex-shrink-0 w-full md:w-64">
                        {/* Poster Image (hidden on mobile) */}
                        <div className="hidden md:block relative w-full h-96 md:h-[24rem] rounded-lg overflow-hidden shadow-lg">
                            <Image
                                src={
                                    show.posterPath
                                        ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
                                        : "/noPoster.jpg"
                                }
                                alt={`${show.name} poster`}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <ShowActionButtons
                            showId={show.id}
                            entityType="show"
                            entityId={show.id}
                            userId={userId}
                            initialTotalWatched={totalWatched}
                            initialTotalLikes={totalLikes}
                            initialTotalReviews={totalReviews}
                        />

                        {/* Review Button */}
                        {userId && (
                            <ShowReviewButton
                                show={{
                                    id: show.id,
                                    name: show.name,
                                    posterPath: show.posterPath,
                                    firstAirDate: show.firstAirDate,
                                    characters: show.seasons.flatMap((season) =>
                                        season.characters.map((character) => ({
                                            id: character.id,
                                            name: character.person.name,
                                            characterName: character.showRole,
                                            profilePath:
                                                character.person.profilePath,
                                            seasonId: season.id,
                                            seasonNumber: season.seasonNumber,
                                        }))
                                    ),
                                }}
                            />
                        )}

                        {/* Add to Watch List Button */}
                        <div className="mt-2">
                            <AddToWatchListButton
                                showId={show.id}
                                showName={show.name}
                            />
                        </div>

                        {/* Start Discussion Button */}
                        <div className="mt-4">
                            <StartDiscussionButton
                                entityType="show"
                                entityId={show.id}
                                entityName={show.name}
                                entityData={{
                                    rating: userRating?.rating,
                                    isFavorited: !!userFavorite
                                }}
                            />
                        </div>

                        {/* Watch On Section */}
                        {show.ShowsOnNetworks.length > 0 && (
                            <div className="rounded-lg shadow mt-4 mb-4">
                                <h3 className="text-lg font-semibold text-green-500 mb-2">
                                    On Network
                                    {show.ShowsOnNetworks.length > 1 ? "s" : ""}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {show.ShowsOnNetworks.map(({ network }) =>
                                        network.homepage ? (
                                            <a
                                                key={network.id}
                                                href={network.homepage}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 bg-white p-1.5 rounded shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                {network.logoPath && (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w92${network.logoPath}`}
                                                        alt={network.name}
                                                        width={24}
                                                        height={24}
                                                        className="object-contain"
                                                    />
                                                )}
                                                <span className="text-xs font-medium text-gray-800">
                                                    {network.name}
                                                </span>
                                            </a>
                                        ) : (
                                            <div
                                                key={network.id}
                                                className="flex items-center gap-1 bg-white p-1.5 rounded shadow-sm border border-gray-200"
                                            >
                                                {network.logoPath && (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w92${network.logoPath}`}
                                                        alt={network.name}
                                                        width={24}
                                                        height={24}
                                                        className="object-contain"
                                                    />
                                                )}
                                                <span className="text-xs font-medium text-gray-800">
                                                    {network.name}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Included in Watch Lists Section - Desktop Only */}
                        {sortedWatchLists.length > 0 && (
                            <div className="hidden md:block mt-3">
                                <h3 className="text-lg font-semibold text-green-500">
                                    Included in Watch Lists
                                </h3>
                                <div className="space-y-0">
                                    {sortedWatchLists.map(
                                        (watchList, index) => (
                                            <div key={watchList.id}>
                                                <Link
                                                    href={`/${watchList.user.username}/watch-list/${watchList.id}`}
                                                    className="block py-3"
                                                >
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-grow">
                                                                <h4 className="text-base font-medium text-white hover:text-green-400 transition-colors">
                                                                    {
                                                                        watchList.name
                                                                    }
                                                                </h4>
                                                                <p className="text-sm text-gray-400">
                                                                    by{" "}
                                                                    {
                                                                        watchList
                                                                            .user
                                                                            .username
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-gray-400">
                                                                    {
                                                                        watchList
                                                                            .shows
                                                                            .length
                                                                    }{" "}
                                                                    show
                                                                    {watchList
                                                                        .shows
                                                                        .length !==
                                                                    1
                                                                        ? "s"
                                                                        : ""}{" "}
                                                                    in this list
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-gray-400">
                                                                <div className="flex items-center gap-1">
                                                                    <FiMessageCircle className="w-4 h-4" />
                                                                    <span className="text-sm">
                                                                        {
                                                                            watchList
                                                                                ._count
                                                                                .comments
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <GiRose className="w-4 h-4 text-red-400" />
                                                                    <span className="text-sm">
                                                                        {
                                                                            watchList
                                                                                ._count
                                                                                .likes
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                                                                                 <div className="flex gap-1">
                                                             {watchList.shows
                                                                 .slice(0, 4)
                                                                 .map(
                                                                    (
                                                                        watchListShow,
                                                                        idx
                                                                    ) => (
                                                                        <Image
                                                                            key={
                                                                                idx
                                                                            }
                                                                            src={
                                                                                watchListShow
                                                                                    .show
                                                                                    .posterPath
                                                                                    ? `https://image.tmdb.org/t/p/w92${watchListShow.show.posterPath}`
                                                                                    : "/noPoster.jpg"
                                                                            }
                                                                            alt="Show poster"
                                                                            width={
                                                                                32
                                                                            }
                                                                            height={
                                                                                48
                                                                            }
                                                                            className="w-16 h-24 rounded object-cover"
                                                                        />
                                                                    )
                                                                )}
                                                        </div>
                                                    </div>
                                                </Link>
                                                {index <
                                                    watchListsWithShow.length -
                                                        1 && (
                                                    <div className="border-t border-gray-700"></div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                                                 {/* Discussions Section - Desktop Only */}
                         <div className="hidden md:block">
                             <EntityDiscussions entityType="show" entityId={show.id} />
                         </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-grow min-w-0">
                        {" "}
                        {/* Added min-w-0 to prevent overflow */}
                        <div className="rounded-lg shadow overflow-hidden h-full flex flex-col">
                            {/* Scrollable Content Area */}
                            <div className="overflow-y-auto p-6 flex-grow ">
                                {show.tagline && (
                                    <p className="text-lg italic text-green-200 mb-6 text-center md:text-left">
                                        &quot;{show.tagline}&quot;
                                    </p>
                                )}

                                {/* Rating Distribution Chart */}
                                <RatingDistributionChart
                                    averageRating={averageRating}
                                    totalRatings={totalRatings}
                                    ratingDistribution={ratingDistribution}
                                />

                                {show.overview && (
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-green-500 mb-3">
                                            Overview
                                        </h2>
                                        <div className="border-b border-gray-600 mb-4"></div>
                                        <p className="text-white whitespace-pre-line">
                                            {show.overview}
                                        </p>
                                    </div>
                                )}

                                {/* Seasons Section - Now contained within scrollable area */}
                                {show.seasons.length > 0 && (
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-green-500 mb-4">
                                            Seasons
                                        </h2>
                                        <div className="border-b border-gray-600 mb-4"></div>
                                        <SeasonEpisodesOfShow
                                            seasons={seasonsWithFormattedDates}
                                            showId={show.id}
                                        />
                                    </div>
                                )}

                                {/* Reviews Section */}
                                <EntityReviews
                                    entityType="show"
                                    entityId={show.id}
                                    entityName={show.name}
                                />

                                {/* Included in Watch Lists Section - Mobile Only */}
                                {sortedWatchLists.length > 0 && (
                                    <div className="md:hidden mb-8">
                                        <h2 className="text-xl font-semibold text-green-500 mb-4">
                                            Included in Watch Lists
                                        </h2>
                                        <div className="border-b border-gray-600 "></div>
                                        <div className="space-y-0">
                                            {sortedWatchLists.map(
                                                (watchList, index) => (
                                                    <div key={watchList.id}>
                                                        <Link
                                                            href={`/${watchList.user.username}/watch-list/${watchList.id}`}
                                                            className="block py-3"
                                                        >
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-grow">
                                                                        <h4 className="text-base font-medium text-white hover:text-green-400 transition-colors">
                                                                            {
                                                                                watchList.name
                                                                            }
                                                                        </h4>
                                                                        <p className="text-sm text-gray-400">
                                                                            by{" "}
                                                                            {
                                                                                watchList
                                                                                    .user
                                                                                    .username
                                                                            }
                                                                        </p>
                                                                        <p className="text-sm text-gray-400">
                                                                            {
                                                                                watchList
                                                                                    .shows
                                                                                    .length
                                                                            }{" "}
                                                                            show
                                                                            {watchList
                                                                                .shows
                                                                                .length !==
                                                                            1
                                                                                ? "s"
                                                                                : ""}{" "}
                                                                            in
                                                                            this
                                                                            list
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-gray-400">
                                                                        <div className="flex items-center gap-1">
                                                                            <FiMessageCircle className="w-4 h-4" />
                                                                            <span className="text-sm">
                                                                                {
                                                                                    watchList
                                                                                        ._count
                                                                                        .comments
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <GiRose className="w-4 h-4 text-red-400" />
                                                                            <span className="text-sm">
                                                                                {
                                                                                    watchList
                                                                                        ._count
                                                                                        .likes
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {watchList.shows
                                                                        .slice(
                                                                            0,
                                                                            4
                                                                        )
                                                                        .map(
                                                                            (
                                                                                watchListShow,
                                                                                idx
                                                                            ) => (
                                                                                <Image
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    src={
                                                                                        watchListShow
                                                                                            .show
                                                                                            .posterPath
                                                                                            ? `https://image.tmdb.org/t/p/w92${watchListShow.show.posterPath}`
                                                                                            : "/noPoster.jpg"
                                                                                    }
                                                                                    alt="Show poster"
                                                                                    width={
                                                                                        32
                                                                                    }
                                                                                    height={
                                                                                        48
                                                                                    }
                                                                                    className="w-16 h-24 rounded object-cover"
                                                                                />
                                                                            )
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                        {index <
                                                            watchListsWithShow.length -
                                                                1 && (
                                                            <div className="border-t border-gray-700 mt-2"></div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Discussions Section - Mobile */}
                                <div className="md:hidden mb-8">
                                    <EntityDiscussions entityType="show" entityId={show.id} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CompletionReviewPrompt
                entityType="show"
                entityId={show.id}
                entityName={show.name}
            />
        </div>
    );
}
