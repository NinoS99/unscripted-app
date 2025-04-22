"use client";

import { useState } from "react";
import RatingComponent from "./RatingComponent";
import Image from "next/image";
import Link from "next/link";

export default function SeasonEpisodes({
    seasons,
    onSeasonSelect,
}: {
    seasons: {
        id: number;
        seasonNumber: number;
        episodes: {
            id: number;
            episodeNumber: number;
            name: string;
            formattedAirDate: string;
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
    onSeasonSelect?: (seasonId: number) => void;
}) {
    const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>(
        {}
    );

    const handleImageLoad = (personId: number) => {
        setLoadedImages((prev) => ({ ...prev, [personId]: true }));
    };

    const handleSeasonSelect = (season: (typeof seasons)[0]) => {
        setSelectedSeason(season);
        if (onSeasonSelect) {
            onSeasonSelect(season.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Season Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {seasons.map((season) => (
                    <button
                        key={season.id}
                        onClick={() => handleSeasonSelect(season)}
                        className={`px-4 py-2 rounded-md whitespace-nowrap flex-shrink-0 ${
                            season.id === selectedSeason.id
                                ? "bg-gray-800 text-green-600"
                                : "bg-gray-100 text-black hover:bg-gray-200"
                        }`}
                    >
                        {season.seasonNumber === 0
                            ? "Specials"
                            : `Season ${season.seasonNumber}`}
                    </button>
                ))}
            </div>
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
                                                onLoadingComplete={() =>
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
                    <h3 className="text-lg font-medium text-green-500">
                        {selectedSeason.seasonNumber === 0
                            ? "Specials"
                            : `Season ${selectedSeason.seasonNumber}`}
                    </h3>
                    <RatingComponent
                        entityType="season"
                        entityId={selectedSeason.id}
                    />
                </div>

                {/* Scrollable Episodes Container */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-custom">
                    {selectedSeason.episodes.map((episode) => (
                        <div
                            key={episode.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-500 rounded"
                        >
                            <div className="mb-2 sm:mb-0">
                                <h4 className="font-medium text-green-500">
                                    {selectedSeason.seasonNumber === 0
                                        ? episode.name
                                        : `${episode.episodeNumber}: ${episode.name}`}
                                </h4>
                                {episode.formattedAirDate && (
                                    <p className="text-xs text-white">
                                        Aired on {episode.formattedAirDate}
                                    </p>
                                )}
                            </div>
                            <RatingComponent
                                entityType="episode"
                                entityId={episode.id}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
