"use client";

import { useState } from "react";
import { FiEdit } from "react-icons/fi";
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
            posterPath?: string | null;
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
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    <FiEdit className="w-4 h-4" />
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