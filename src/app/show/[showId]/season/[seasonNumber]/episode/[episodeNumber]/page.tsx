import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import RatingComponent from "@/components/RatingComponent";
import FavouriteButton from "@/components/FavouriteButton";
import EpisodeReviewButton from "@/components/EpisodeReviewButton";
import EntityReviews from "@/components/EntityReviews";
import { format } from "date-fns";
import Link from "next/link";
import {
    CalendarIcon,
    FilmIcon,
    TvIcon,
} from "@heroicons/react/24/outline";

const prisma = new PrismaClient();

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

    return (
        <div className="min-h-screen bg-gray-100 container mx-auto">
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
                            <p>Aired on {formatDate(episode.airDate)}</p>
                        )}
                        {episode.season.show.creator.length > 0 && (
                            <p>
                                Created by{" "}
                                {episode.season.show.creator
                                    .map((c) => c.creator.name)
                                    .join(", ")}
                            </p>
                        )}
                    </div>
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
                                borderBottom: "4px solid #4ade80",
                                borderTop: "4px solid #4ade80",
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
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-2 md:px-8 md:py-8 bg-gray-900">
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

                        {/* Action Buttons */}
                        <div className="w-full mt-4 space-y-4">
                            <div className="rounded-lg shadow pt-4 pb-4 pl-2 pr-2 border-1 border-green-200">
                                {userId ? (
                                    <div className="flex items-center justify-between">
                                        <FavouriteButton
                                            entityType="episode"
                                            entityId={episode.id}
                                        />
                                        <div className="flex items-center gap-2 mr-2">
                                            <RatingComponent
                                                entityType="episode"
                                                entityId={episode.id}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-1">
                                        <p className="text-green-200 text-center text-sm">
                                            Log in to rate, favourite or review this episode!
                                        </p>
                                    </div>
                                )}
                            </div>
                            
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
                                            show: {
                                                id: Number(showId),
                                                name: episode.season.show.name,
                                                posterPath: episode.season.show.posterPath
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-grow min-w-0">
                        <div className="rounded-lg shadow overflow-hidden h-full flex flex-col border-2 border-green-200">
                            <div className="overflow-y-auto p-6 flex-grow">
                                {episode.overview && (
                                    <div className="mb-5">
                                        <h2 className="text-xl font-semibold text-green-500 mb-3">
                                            Episode Overview
                                        </h2>
                                        <p className="text-white whitespace-pre-line">
                                            {episode.overview}
                                        </p>
                                    </div>
                                )}

                                {/* Episode Details */}
                                <div className="flex flex-wrap gap-4 text-white items-center mb-8">
                                    <div className="flex items-center">
                                        <TvIcon className="h-4 w-4 mr-1 text-green-400" />
                                        <span>
                                            {episode.season.seasonNumber === 0
                                                ? "Specials"
                                                : `S${episode.season.seasonNumber}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <FilmIcon className="h-4 w-4 mr-1 text-green-400" />
                                        <span>E{episode.episodeNumber}</span>
                                    </div>
                                    {episode.airDate && (
                                        <div className="flex items-center">
                                            <CalendarIcon className="h-4 w-4 mr-1 text-green-400" />
                                            <span>
                                                {formatDate(episode.airDate)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Reviews Section */}
                                <EntityReviews
                                    entityType="episode"
                                    entityId={episode.id}
                                    entityName={`${episode.season.show.name} - S${episode.season.seasonNumber}E${episode.episodeNumber} - ${episode.name}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
