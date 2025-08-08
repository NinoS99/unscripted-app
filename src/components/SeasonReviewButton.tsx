"use client";

import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import SeasonReview from "./SeasonReview";

interface SeasonReviewButtonProps {
    season: {
        id: number;
        seasonNumber: number;
        overview?: string | null;
        airDate?: Date | null;
        posterPath?: string | null;
        show: {
            id: number;
            name: string;
            posterPath?: string | null;
        };
        characters?: {
            id: number;
            name: string;
            characterName?: string | null;
            profilePath?: string | null;
        }[];
    };
}

export default function SeasonReviewButton({ season }: SeasonReviewButtonProps) {
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
            
            <SeasonReview
                season={season}
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
            />
        </>
    );
} 