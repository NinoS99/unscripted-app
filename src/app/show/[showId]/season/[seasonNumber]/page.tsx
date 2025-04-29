import { PrismaClient } from "@prisma/client";
import Image from "next/image";
import RatingComponent from "@/components/RatingComponent";
import FavouriteButton from "@/components/FavouriteButton";
import EpisodesOfSeason from "@/components/EpisodesOfSeason";
import { format } from "date-fns";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function SeasonPage({
    params,
}: {
    params: Promise<{ showId: string; seasonNumber: string }>;
}) {
    const { showId, seasonNumber } = await params;
    const seasonNum = parseInt(seasonNumber);

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

    return (
        <div className="min-h-screen bg-gray-100 container mx-auto">
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
                            <p>Season aired on {formatDate(season.airDate)}</p>
                        )}
                        {season.show.creator.length > 0 && (
                            <p>
                                Created by{" "}
                                {season.show.creator
                                    .map((c) => c.creator.name)
                                    .join(", ")}
                            </p>
                        )}
                    </div>
                </div>
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
                                borderBottom: "4px solid #4ade80",
                                borderTop: "4px solid #4ade80",
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
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-2 md:px-8 md:py-8 bg-gray-600">
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

                        {/* Action Buttons */}
                        <div className="w-full mt-4 space-y-4">
                            <div className="rounded-lg shadow pt-4 pb-4 pl-2 pr-2 border-1 border-green-200">
                                <div className="flex items-center justify-between">
                                    <FavouriteButton
                                        entityType="season"
                                        entityId={season.id}
                                    />
                                    <div className="flex items-center gap-2 mr-2">
                                        <RatingComponent
                                            entityType="season"
                                            entityId={season.id}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-grow min-w-0">
                        <div className="rounded-lg shadow overflow-hidden h-full flex flex-col border-2 border-green-200">
                            <div className="overflow-y-auto p-6 flex-grow">
                                {season.overview && (
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-green-500 mb-3">
                                            Season Overview
                                        </h2>
                                        <p className="text-white whitespace-pre-line">
                                            {season.overview}
                                        </p>
                                    </div>
                                )}

                                {/* Episodes Section */}
                                <div className="mb-8">
                                    <EpisodesOfSeason
                                        episodes={episodesWithFormattedDates}
                                        seasonNumber={season.seasonNumber}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
