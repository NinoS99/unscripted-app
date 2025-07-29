"use client";

import { useState } from "react";
import ShowReview from "./ShowReview";
import SeasonReview from "./SeasonReview";
import EpisodeReview from "./EpisodeReview";

interface ShowData {
    type: "show";
    data: {
        id: number;
        name: string;
        posterPath?: string | null;
        firstAirDate?: Date | null;
        characters?: {
            id: number;
            name: string;
            characterName?: string | null;
            profilePath?: string | null;
        }[];
    };
}

interface SeasonData {
    type: "season";
    data: {
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

interface EpisodeData {
    type: "episode";
    data: {
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
        characters?: {
            id: number;
            name: string;
            characterName?: string | null;
            profilePath?: string | null;
        }[];
    };
}

type ReviewData = ShowData | SeasonData | EpisodeData;

interface DynamicReviewButtonProps {
    entity: ReviewData;
    buttonText?: string;
    buttonClassName?: string;
}

export default function DynamicReviewButton({ 
    entity, 
    buttonText = "Write a Review",
    buttonClassName = "px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
}: DynamicReviewButtonProps) {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const renderReviewComponent = () => {
        switch (entity.type) {
            case "show":
                return (
                    <ShowReview
                        show={entity.data}
                        isOpen={isReviewOpen}
                        onClose={() => setIsReviewOpen(false)}
                    />
                );
            case "season":
                return (
                    <SeasonReview
                        season={entity.data}
                        isOpen={isReviewOpen}
                        onClose={() => setIsReviewOpen(false)}
                    />
                );
            case "episode":
                return (
                    <EpisodeReview
                        episode={entity.data}
                        isOpen={isReviewOpen}
                        onClose={() => setIsReviewOpen(false)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="mt-4">
                <button
                    onClick={() => setIsReviewOpen(true)}
                    className={buttonClassName}
                >
                    {buttonText}
                </button>
            </div>
            
            {renderReviewComponent()}
        </>
    );
} 