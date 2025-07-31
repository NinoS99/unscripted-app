"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface EpisodeNavigationProps {
    showId: number;
    currentSeasonNumber: number;
    currentEpisodeNumber: number;
}

interface Episode {
    id: number;
    episodeNumber: number;
    seasonNumber: number;
}

export default function EpisodeNavigation({ 
    showId, 
    currentSeasonNumber, 
    currentEpisodeNumber 
}: EpisodeNavigationProps) {
    const router = useRouter();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                const response = await fetch(`/api/shows/${showId}/episodes`);
                if (response.ok) {
                    const data = await response.json();
                    setEpisodes(data.episodes);
                }
            } catch (error) {
                console.error("Error fetching episodes:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEpisodes();
    }, [showId]);

    if (isLoading) {
        return null;
    }

    // Find current episode index
    const currentIndex = episodes.findIndex(
        episode => episode.seasonNumber === currentSeasonNumber && 
                   episode.episodeNumber === currentEpisodeNumber
    );
    
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < episodes.length - 1;
    
    const previousEpisode = hasPrevious ? episodes[currentIndex - 1] : null;
    const nextEpisode = hasNext ? episodes[currentIndex + 1] : null;

    const navigateToEpisode = (seasonNumber: number, episodeNumber: number) => {
        router.push(`/show/${showId}/season/${seasonNumber}/episode/${episodeNumber}`);
    };

    if (!hasPrevious && !hasNext) {
        return null;
    }

    const getEpisodeTitle = (episode: Episode) => {
        const seasonText = episode.seasonNumber === 0 ? "Specials" : `Season ${episode.seasonNumber}`;
        return `${seasonText} Episode ${episode.episodeNumber}`;
    };

    return (
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            {hasPrevious && (
                <button
                    onClick={() => navigateToEpisode(previousEpisode!.seasonNumber, previousEpisode!.episodeNumber)}
                    className="p-2 md:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors group"
                    title={`Previous episode (${getEpisodeTitle(previousEpisode!)})`}
                >
                    <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            )}
            {hasNext && (
                <button
                    onClick={() => navigateToEpisode(nextEpisode!.seasonNumber, nextEpisode!.episodeNumber)}
                    className="p-2 md:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors group"
                    title={`Next episode (${getEpisodeTitle(nextEpisode!)})`}
                >
                    <FiChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            )}
        </div>
    );
} 