"use client";

import { useUser } from "@clerk/nextjs";
import RatingComponent from "./RatingComponent";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiRose } from "react-icons/gi";
import { FiEye } from "react-icons/fi";

export default function EpisodesOfSeason({
    episodes,
    seasonNumber,
    characters,
    showId,
}: {
    episodes: {
        id: number;
        episodeNumber: number;
        name: string;
        overview?: string | null;
        formattedAirDate: string;
        tmdbRating?: number | null;
        stillPath?: string | null;
    }[];
    seasonNumber: number;
    characters?: {
        id: number;
        personId: number;
        person: {
            id: number;
            name: string;
            profilePath: string | null;
        };
        showRole: string | null;
    }[];
    showId: number;
}) {
    const { user } = useUser();
    const pathname = usePathname();
    const [expandedEpisodes, setExpandedEpisodes] = useState<
        Record<number, boolean>
    >({});
    const [isMobile, setIsMobile] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
    const [episodeStatuses, setEpisodeStatuses] = useState<Record<number, { isFavorited: boolean; isWatched: boolean }>>({});

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (user && episodes.length > 0) {
            const fetchEpisodeStatuses = async () => {
                const statuses: Record<number, { isFavorited: boolean; isWatched: boolean }> = {};
                
                await Promise.all(
                    episodes.map(async (episode) => {
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
                        
                        statuses[episode.id] = { isFavorited, isWatched };
                    })
                );
                
                setEpisodeStatuses(statuses);
            };
            
            fetchEpisodeStatuses();
        }
    }, [user, episodes]);

    const handleImageLoad = (personId: number) => {
        setLoadedImages((prev) => ({ ...prev, [personId]: true }));
    };

    const toggleExpand = (episodeId: number) => {
        setExpandedEpisodes((prev) => ({
            ...prev,
            [episodeId]: !prev[episodeId],
        }));
    };

    const getTruncatedOverview = (overview: string) => {
        if (isMobile) {
            return overview.length > 300
                ? `${overview.substring(0, 300)}...`
                : overview;
        } else {
            return overview.length > 500
                ? `${overview.substring(0, 500)}...`
                : overview;
        }
    };

    return (
        <div className="space-y-6">
            {/* Cast Section - Added above episodes */}
            {characters && characters.length > 0 && (
                <div className="p-4">
                    <h3 className="text-lg font-medium text-green-500 mb-4">
                        Cast
                    </h3>
                    <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2 scrollbar-custom">
                        {characters.map((character) => (
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
                                                loadedImages[character.person.id]
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
                                                    handleImageLoad(character.person.id)
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

            {/* Episodes Section */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-green-500">
                    {seasonNumber === 0
                        ? "Special Episodes"
                        : `Episodes (${episodes.length})`}
                </h3>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-custom">
                {episodes.map((episode) => {
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
                                        href={`/show/${showId}/season/${seasonNumber}/episode/${episode.episodeNumber}`}
                                        className="group flex items-center gap-2"
                                        >
                                        <h4 className="font-medium text-green-500 hover:text-green-400 transition-colors">
                                            {seasonNumber === 0
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
                                {user ? (
                                    <RatingComponent
                                        entityType="episode"
                                        entityId={episode.id}
                                    />
                                ) : (
                                    <p className="text-gray-400 text-sm">
                                        <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`} className="text-green-400 hover:text-green-300 transition-colors font-medium">
                                            Sign in
                                        </Link>{" "}
                                        to rate this episode!
                                    </p>
                                )}
                            </div>
                            {episode.formattedAirDate && (
                                <p className="text-xs text-white mb-3 sm:mb-2 mt-0">
                                    {isFutureDate ? "Airs on " : "Aired on "}
                                    {episode.formattedAirDate}
                                </p>
                            )}
                            {episode.overview && (
                                <div className="text-sm text-gray-200 mt-2 sm:mt-1">
                                    {expandedEpisodes[episode.id]
                                        ? episode.overview
                                        : getTruncatedOverview(
                                              episode.overview
                                          )}
                                    {episode.overview.length >
                                        (isMobile ? 300 : 500) && (
                                        <button
                                            onClick={() =>
                                                toggleExpand(episode.id)
                                            }
                                            className="text-green-400 hover:text-green-300 ml-1"
                                        >
                                            {expandedEpisodes[episode.id]
                                                ? "Show less"
                                                : "Read more"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}