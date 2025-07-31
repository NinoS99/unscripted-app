"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface SeasonNavigationProps {
    showId: number;
    currentSeasonNumber: number;
}

interface Season {
    id: number;
    seasonNumber: number;
}

export default function SeasonNavigation({ showId, currentSeasonNumber }: SeasonNavigationProps) {
    const router = useRouter();
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const response = await fetch(`/api/shows/${showId}/seasons`);
                if (response.ok) {
                    const data = await response.json();
                    setSeasons(data.seasons);
                }
            } catch (error) {
                console.error("Error fetching seasons:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSeasons();
    }, [showId]);

    if (isLoading) {
        return null;
    }

    // Sort seasons by season number (0 comes first, then 1, 2, etc.)
    const sortedSeasons = seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    const currentIndex = sortedSeasons.findIndex(season => season.seasonNumber === currentSeasonNumber);
    
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < sortedSeasons.length - 1;
    
    const previousSeason = hasPrevious ? sortedSeasons[currentIndex - 1] : null;
    const nextSeason = hasNext ? sortedSeasons[currentIndex + 1] : null;

    const navigateToSeason = (seasonNumber: number) => {
        router.push(`/show/${showId}/season/${seasonNumber}`);
    };

    if (!hasPrevious && !hasNext) {
        return null;
    }

    return (
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            {hasPrevious && (
                <button
                    onClick={() => navigateToSeason(previousSeason!.seasonNumber)}
                    className="p-2 md:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors group"
                    title={`Previous season (Season ${previousSeason!.seasonNumber === 0 ? "Specials" : previousSeason!.seasonNumber})`}
                >
                    <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            )}
            {hasNext && (
                <button
                    onClick={() => navigateToSeason(nextSeason!.seasonNumber)}
                    className="p-2 md:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors group"
                    title={`Next season (Season ${nextSeason!.seasonNumber === 0 ? "Specials" : nextSeason!.seasonNumber})`}
                >
                    <FiChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            )}
        </div>
    );
} 