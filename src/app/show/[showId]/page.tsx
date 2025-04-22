import { PrismaClient } from "@prisma/client";
import Image from "next/image";
import RatingComponent from "./RatingComponent";
import FavouriteButton from "./FavouriteButton";
import SeasonEpisodes from "./SeasonEpisodes";
import { format } from "date-fns";

const prisma = new PrismaClient();

export default async function ShowPage({
    params,
}: {
    params: Promise<{ showId: string }>;
}) {
    const { showId } = await params;

    const show = await prisma.show.findUnique({
        where: { id: Number(showId) },
        include: {
            creator: { include: { creator: true } },
            ShowsOnNetworks: { include: { network: true } },
            tags: { include: { tag: true } },
            seasons: {
                orderBy: { seasonNumber: "asc" },
                include: {
                    episodes: {
                        orderBy: { episodeNumber: "asc" },
                    },
                    characters: {
                        include: {
                            person: true,
                        },
                    },
                },
            },
        },
    });

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
            : "Unknown";

    const seasonsWithFormattedDates = show.seasons.map((season) => ({
        ...season,
        episodes: season.episodes.map((ep) => ({
            ...ep,
            formattedAirDate: formatDate(ep.airDate),
        })),
    }));

    return (
        <div className="min-h-screen bg-gray-100 container mx-auto">
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
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
                {/* Poster with overlayed title/info */}
                <div className="relative aspect-[2/3] w-full">
                    {show.posterPath ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w500${show.posterPath}`}
                            alt={`${show.name} poster`}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-800"></div>
                    )}

                    {/* Overlayed Text Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-2 md:px-8 md:py-8 bg-gray-600">
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

                        {/* Action Buttons - Same Width as Poster */}
                        <div className="w-full mt-4 space-y-4">
                            <div className="rounded-lg shadow pt-4 pb-4 pl-2 pr-2 border-1 border-green-200">
                                <div className="flex items-center justify-between">
                                    <FavouriteButton showId={show.id} />
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500 font-medium">
                                            Rate:
                                        </span>
                                        <RatingComponent
                                            entityType="show"
                                            entityId={show.id}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Watch On Section */}
                            {show.ShowsOnNetworks.length > 0 && (
                                <div className="rounded-lg shadow p-4 border-1 border-green-200">
                                    <h3 className="text-md font-semibold text-green-500 mb-2">
                                        Watch On
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {show.ShowsOnNetworks.map(
                                            ({ network }) => (
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
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-grow min-w-0">
                        {" "}
                        {/* Added min-w-0 to prevent overflow */}
                        <div className="rounded-lg shadow overflow-hidden h-full flex flex-col border-2 border-green-200">
                            {/* Scrollable Content Area */}
                            <div className="overflow-y-auto p-6 flex-grow ">
                                {show.tagline && (
                                    <p className="text-lg italic text-green-200 mb-6 text-center md:text-left">
                                        &quot;{show.tagline}&quot;
                                    </p>
                                )}

                                {show.overview && (
                                    <div className="mb-8">
                                        <h2 className="text-xl font-semibold text-green-500 mb-3">
                                            Overview
                                        </h2>
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
                                        <SeasonEpisodes
                                            seasons={seasonsWithFormattedDates}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
