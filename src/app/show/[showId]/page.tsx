import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import RatingComponent from "../../../components/RatingComponent";
import FavouriteButton from "../../../components/FavouriteButton";
import ShowReviewButton from "../../../components/ReviewButton";
import SeasonEpisodesOfShow from "../../../components/SeasonEpisodesOfShow";
import EntityReviews from "../../../components/EntityReviews";
import { format } from "date-fns";

const prisma = new PrismaClient();

export default async function ShowPage({
    params,
}: {
    params: Promise<{ showId: string }>;
}) {
    const { showId } = await params;
    const { userId } = await auth();

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
            : null;

    const seasonsWithFormattedDates = show.seasons.map((season) => ({
        ...season,
        episodes: season.episodes.map((ep) => ({
            ...ep,
            formattedAirDate: formatDate(ep.airDate),
        })),
    }));

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

                        {/* Action Buttons - Same Width as Poster */}
                        <div className="w-full mt-4 space-y-4">
                            <div className="rounded-lg shadow pt-4 pb-4 pl-2 pr-2 border-1 border-green-200">
                                {userId ? (
                                    <div className="flex items-center justify-between">
                                        <FavouriteButton
                                            entityType="show"
                                            entityId={show.id}
                                        />
                                        <div className="flex items-center gap-2 mr-2">
                                            <RatingComponent
                                                entityType="show"
                                                entityId={show.id}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-1">
                                        <p className="text-green-200 text-center text-sm">
                                            Log in to rate, favourite or review this show!
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Review Button */}
                            {userId && (
                                <ShowReviewButton
                                    show={{
                                        id: show.id,
                                        name: show.name,
                                        posterPath: show.posterPath,
                                        firstAirDate: show.firstAirDate,
                                        characters: show.seasons.flatMap(season => 
                                            season.characters.map(character => ({
                                                id: character.id,
                                                name: character.person.name,
                                                characterName: character.showRole,
                                                profilePath: character.person.profilePath,
                                            }))
                                        ),
                                    }}
                                />
                            )}

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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
