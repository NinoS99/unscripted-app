"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import RatingComponent from "./RatingComponent";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiRose } from "react-icons/gi";
import { FiEye } from "react-icons/fi";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function SeasonEpisodesOfShow({
    seasons,
    showId,
    onSeasonSelect,
}: {
    seasons: {
        id: number;
        seasonNumber: number;
        overview?: string | null; // Allow null
        episodes: {
            id: number;
            episodeNumber: number;
            name: string;
            overview?: string | null;
            formattedAirDate?: string | null;
        }[];
        characters: {
            id: number;
            personId: number;
            person: {
                id: number;
                name: string;
                profilePath: string | null;
            };
            showRole: string | null;
        }[];
    }[];
    showId: number;
    onSeasonSelect?: (seasonId: number) => void;
}) {
    const pathname = usePathname();
    const { user } = useUser();
    const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
    const [expandedOverview, setExpandedOverview] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>(
        {}
    );
    const [isMobile, setIsMobile] = useState(false);
    const [seasonStatuses, setSeasonStatuses] = useState<Record<number, { isFavorited: boolean; isWatched: boolean }>>({});
    const [episodeStatuses, setEpisodeStatuses] = useState<Record<number, { isFavorited: boolean; isWatched: boolean }>>({});
    const [expandedEpisodes, setExpandedEpisodes] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
        };

        // Set initial value
        handleResize();

        // Add event listener
        window.addEventListener("resize", handleResize);

        // Clean up
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (user) {
            const fetchStatuses = async () => {
                const seasonStatusesData: Record<number, { isFavorited: boolean; isWatched: boolean }> = {};
                const episodeStatusesData: Record<number, { isFavorited: boolean; isWatched: boolean }> = {};
                
                // Fetch season statuses
                await Promise.all(
                    seasons.map(async (season) => {
                        const [favoriteResponse, watchedResponse] = await Promise.all([
                            fetch(`/api/favourites?entityType=season&entityId=${season.id}`),
                            fetch(`/api/watched/check`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ entityType: "season", entityId: season.id })
                            })
                        ]);
                        
                        const isFavorited = favoriteResponse.ok ? (await favoriteResponse.json()).isFavorite : false;
                        const isWatched = watchedResponse.ok ? (await watchedResponse.json()).isWatched : false;
                        
                        seasonStatusesData[season.id] = { isFavorited, isWatched };
                    })
                );
                
                // Fetch episode statuses for selected season
                await Promise.all(
                    selectedSeason.episodes.map(async (episode) => {
                        const [favoriteResponse, watchedResponse] = await Promise.all([
                            fetch(`/api/favourites?entityType=episode&entityId=${episode.id}`),
                            fetch(`/api/watched/check`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ entityType: "episode", entityId: episode.id })
                            })
                        ]);
                        
                        const isFavorited = favoriteResponse.ok ? (await favoriteResponse.json()).isFavorite : false;
                        const isWatched = watchedResponse.ok ? (await watchedResponse.json()).isWatched : false;
                        
                        episodeStatusesData[episode.id] = { isFavorited, isWatched };
                    })
                );
                
                setSeasonStatuses(seasonStatusesData);
                setEpisodeStatuses(episodeStatusesData);
            };
            
            fetchStatuses();
        }
    }, [user, seasons, selectedSeason]);

    const handleImageLoad = (personId: number) => {
        setLoadedImages((prev) => ({ ...prev, [personId]: true }));
    };

    const handleSeasonSelect = (season: (typeof seasons)[0]) => {
        setSelectedSeason(season);
        if (onSeasonSelect) {
            onSeasonSelect(season.id);
        }
    };

    const toggleOverview = () => {
        setExpandedOverview(!expandedOverview);
    };

    const toggleExpand = (episodeId: number) => {
        setExpandedEpisodes((prev) => ({
            ...prev,
            [episodeId]: !prev[episodeId],
        }));
    };



    // Calculate the truncation length based on screen size
    const truncateLength = isMobile ? 300 : 500;

    return (
        <div className="space-y-6">
            {/* Season Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {seasons.map((season) => (
                    <button
                        key={season.id}
                        onClick={() => handleSeasonSelect(season)}
                        className={`px-4 py-2 rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                            season.id === selectedSeason.id
                                ? "bg-gray-800 text-green-600"
                                : "bg-gray-100 text-black hover:bg-gray-200"
                        }`}
                    >
                        <span>
                            {season.seasonNumber === 0
                                ? "Specials"
                                : `Season ${season.seasonNumber}`}
                        </span>
                        {user && seasonStatuses[season.id] && (
                            <div className="flex items-center gap-1">
                                {seasonStatuses[season.id].isFavorited && (
                                    <GiRose className="w-3 h-3 text-red-400 fill-current" title="Favorited" />
                                )}
                                {seasonStatuses[season.id].isWatched && (
                                    <FiEye className="w-3 h-3 text-green-400" title="Watched" />
                                )}
                            </div>
                        )}
                    </button>
                ))}
            </div>
            {/* Season Overview Section */}
            {selectedSeason.overview && (
                <div className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium text-green-500 mb-2">
                        Season Overview
                    </h3>
                    <div className="text-white">
                        {expandedOverview || selectedSeason.overview.length <= truncateLength
                            ? selectedSeason.overview
                            : `${selectedSeason.overview.substring(0, truncateLength)}...`}
                        {selectedSeason.overview.length > truncateLength && (
                            <button
                                onClick={toggleOverview}
                                className="text-green-400 hover:text-green-300 ml-1"
                            >
                                {expandedOverview ? "Show less" : "Read more"}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Cast Section */}
            {selectedSeason.characters?.length > 0 && (
                <div className="p-4">
                    <h3 className="text-lg font-medium text-green-500 mb-4">
                        Cast
                    </h3>
                    <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2 scrollbar-custom">
                        {selectedSeason.characters.map((character) => (
                            <Link
                                key={character.id}
                                href={`/person/${character.personId}`}
                                className="flex flex-col items-center min-w-[80px] group"
                            >
                                <div className="relative w-16 h-16 rounded-full overflow-hidden mb-2 bg-gray-200">
                                    {/* Always show noAvatar.png first */}
                                    <div
                                        className={`absolute inset-0 transition-opacity duration-300 ${
                                            loadedImages[character.person.id]
                                                ? "opacity-0"
                                                : "opacity-100"
                                        }`}
                                    >
                                        <Image
                                            src="/noAvatar.png"
                                            alt={character.person.name}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>

                                    {/* Show profile image when loaded */}
                                    {character.person.profilePath && (
                                        <div
                                            className={`absolute inset-0 transition-opacity duration-300 ${
                                                loadedImages[
                                                    character.person.id
                                                ]
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            }`}
                                        >
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w185${character.person.profilePath}`}
                                                alt={character.person.name}
                                                fill
                                                className="object-cover group-hover:opacity-80 transition-opacity"
                                                onLoad={() =>
                                                    handleImageLoad(
                                                        character.person.id
                                                    )
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm text-white text-center group-hover:text-green-400 transition-colors">
                                    {character.person.name}
                                </span>
                                {character.showRole &&
                                    ["narrator", "host"].some(
                                        (role) =>
                                            character.showRole &&
                                            character.showRole
                                                .toLowerCase()
                                                .includes(role)
                                    ) && (
                                        <span className="text-xs text-gray-300 text-center">
                                            as {character.showRole}
                                        </span>
                                    )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Episodes List */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <Link
                        href={`/show/${showId}/season/${selectedSeason.seasonNumber}`}
                        className="group flex items-center gap-2"
                    >
                        <h3
                            className={`
                                text-lg font-medium 
                              text-green-500 hover:text-green-400 
                                transition-all duration-200
                                border border-green-500 rounded-lg
                                px-4 py-1.5
                              hover:bg-green-500/10
                              active:bg-green-500/20
                                flex items-center
                        `}
                        >
                            {selectedSeason.seasonNumber === 0
                                ? "Specials"
                                : `Season ${selectedSeason.seasonNumber}`}
                        </h3>
                    </Link>
                    {user ? (
                        <RatingComponent
                            entityType="season"
                            entityId={selectedSeason.id}
                        />
                    ) : (
                        <p className="text-gray-400 text-sm">
                            <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`} className="text-green-400 hover:text-green-300 transition-colors font-medium">
                                Sign in
                            </Link>{" "}
                            to rate this season!
                        </p>
                    )}
                </div>

                {/* Scrollable Episodes Container */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-custom">
                    {selectedSeason.episodes.map((episode) => {
                        const airDate = episode.formattedAirDate
                            ? new Date(episode.formattedAirDate)
                            : null;
                        const isFutureDate = airDate && airDate > new Date();

                        return (
                            <div
                                key={episode.id}
                                className="flex flex-col p-3 bg-gray-800 rounded"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-2">
                                    <div className="mb-2 sm:mb-0">
                                        <div className="flex items-center gap-2">
                                            <Link 
                                            href={`/show/${showId}/season/${selectedSeason.seasonNumber}/episode/${episode.episodeNumber}`}
                                            className="group flex items-center gap-2"
                                            >
                                            <h4 className="font-medium text-green-500 hover:text-green-400 transition-colors">
                                                {selectedSeason.seasonNumber === 0
                                                    ? episode.name
                                                    : `${episode.episodeNumber}: ${episode.name}`}
                                            </h4>
                                            </Link>
                                            {user && episodeStatuses[episode.id] && (
                                                <div className="flex items-center gap-1">
                                                    {episodeStatuses[episode.id].isFavorited && (
                                                        <GiRose className="w-4 h-4 text-red-400 fill-current" title="Favorited" />
                                                    )}
                                                    {episodeStatuses[episode.id].isWatched && (
                                                        <FiEye className="w-4 h-4 text-green-400" title="Watched" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {user && (
                                        <RatingComponent
                                            entityType="episode"
                                            entityId={episode.id}
                                        />
                                    )}
                                </div>
                                {episode.formattedAirDate && (
                                    <p className="text-xs text-white mb-3 sm:mb-2 mt-0">
                                        {isFutureDate
                                            ? "Airs on "
                                            : "Aired on "}
                                        {episode.formattedAirDate}
                                    </p>
                                )}

                                {episode.overview && (
                                    <div className="mt-2 sm:mt-1">
                                        <button
                                            onClick={() =>
                                                toggleExpand(episode.id)
                                            }
                                            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                                        >
                                            {expandedEpisodes[episode.id] ? (
                                                <>
                                                    <FiChevronUp className="w-4 h-4" />
                                                    Hide episode overview
                                                </>
                                            ) : (
                                                <>
                                                    <FiChevronDown className="w-4 h-4" />
                                                    Show episode overview
                                                </>
                                            )}
                                        </button>
                                        {expandedEpisodes[episode.id] && (
                                            <div className="text-sm text-gray-200 mt-2">
                                                {episode.overview}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
