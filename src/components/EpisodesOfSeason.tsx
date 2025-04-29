"use client";

import RatingComponent from "./RatingComponent";
import { useState, useEffect } from "react";

export default function EpisodesOfSeason({
    episodes,
    seasonNumber,
}: {
    episodes: {
        id: number;
        episodeNumber: number;
        name: string;
        overview?: string | null; // Allow null
        formattedAirDate: string;
        tmdbRating?: number | null; // Optional fields
        stillPath?: string | null;
    }[];
    seasonNumber: number;
}) {
    const [expandedEpisodes, setExpandedEpisodes] = useState<
        Record<number, boolean>
    >({});
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
        };

        // Set initial value
        checkMobile();

        // Add event listener
        window.addEventListener("resize", checkMobile);

        // Clean up
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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
                            className="flex flex-col p-3 bg-gray-500 rounded"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                <h4 className="font-medium text-green-500">
                                    {seasonNumber === 0
                                        ? episode.name
                                        : `Episode ${episode.episodeNumber}: ${episode.name}`}
                                </h4>
                                <RatingComponent
                                    entityType="episode"
                                    entityId={episode.id}
                                />
                            </div>
                            {episode.formattedAirDate && (
                                <p className="text-xs text-white mb-2">
                                    {isFutureDate ? "Airs on " : "Aired on "}
                                    {episode.formattedAirDate}
                                </p>
                            )}
                            {episode.overview && (
                                <div className="text-sm text-gray-200 mt-2">
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
