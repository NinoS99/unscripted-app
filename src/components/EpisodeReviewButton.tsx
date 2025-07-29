"use client";

import { useState } from "react";
import EpisodeReview from "./EpisodeReview";

interface EpisodeReviewButtonProps {
    episode: {
        id: number;
        episodeNumber: number;
        name: string;
        overview?: string | null;
        airDate?: Date | null;
        stillPath?: string | null;
        season: {
            id: number;
            seasonNumber: number;
            show: {
                id: number;
                name: string;
                posterPath?: string | null;
            };
        };
    };
}

export default function EpisodeReviewButton({ episode }: EpisodeReviewButtonProps) {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    return (
        <>
            <div className="mt-4">
                <button
                    onClick={() => setIsReviewOpen(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                    Write a Review
                </button>
            </div>
            
            <EpisodeReview
                episode={episode}
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
            />
        </>
    );
} 