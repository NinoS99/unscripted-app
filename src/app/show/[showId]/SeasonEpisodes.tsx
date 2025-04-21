"use client";

import { useState } from "react";
import RatingComponent from "./RatingComponent";

export default function SeasonEpisodes({
    seasons,
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
    }[];
}) {
    const [selectedSeason, setSelectedSeason] = useState(seasons[0]);

    return (
        <>
            {/* Season Selector */}
            <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {seasons.map((season) => (
                        <button
                            key={season.id}
                            onClick={() => setSelectedSeason(season)}
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

                    <div className="space-y-4">
                        {selectedSeason.episodes.map((episode) => (
                            <div
                                key={episode.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded"
                            >
                                <div className="mb-2 sm:mb-0">
                                    <h4 className="font-medium text-green-500">
                                        {selectedSeason.seasonNumber === 0
                                            ? episode.name
                                            : `Episode ${episode.episodeNumber}: ${episode.name}`}
                                    </h4>
                                    {episode.formattedAirDate && (
                                        <p className="text-xs text-gray-500">
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
        </>
    );
}
