"use client";

import { FiStar } from "react-icons/fi";

interface RatingDistributionChartProps {
    averageRating: string;
    totalRatings: number;
    ratingDistribution: Array<{
        rating: number;
        count: number;
        percentage: number;
    }>;
    entityType?: "show" | "season" | "episode";
}

export default function RatingDistributionChart({ 
    averageRating, 
    totalRatings, 
    ratingDistribution,
    entityType
}: RatingDistributionChartProps) {
    const getRealityTVText = (count: number) => {
        if (count === 0) return "No islanders rated";
        if (count === 1) return "1 islander rated";
        if (count <= 5) return `${count} islanders rated`;
        if (count <= 20) return `${count} contestants rated`;
        if (count <= 50) return `${count} housemates rated`;
        return `${count} reality stars rated`;
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-green-500 mb-4">Ratings</h2>
            <div className="border-b border-gray-600 mb-4"></div>
            <div className="space-y-3">
                {totalRatings > 0 ? (
                    <div className="flex items-center gap-4 text-gray-300">
                        <div className="flex items-center gap-1">
                            <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-semibold">{averageRating}</span>
                            <span className="text-sm">/ 5</span>
                        </div>
                        <span className="text-sm">•</span>
                        <span className="text-sm">{getRealityTVText(totalRatings)}</span>
                    </div>
                ) : (
                    <div className="text-gray-300 text-center">
                        <span className="text-sm">Be the first to rate this {entityType}</span>
                    </div>
                )}
                
                <div className="flex items-end gap-1 h-20">
                    {ratingDistribution.map(({ rating, count, percentage }) => {
                        // Calculate max height to ensure bars don't exceed the average rating div height
                        const maxHeight = 60; // Height of the average rating div area
                        const barHeight = Math.min(Math.max(percentage * 1.0, 2), maxHeight);
                        
                        return (
                            <div 
                                key={rating} 
                                className="flex-1 flex flex-col items-center group relative"
                                title={`${count} ${count === 1 ? 'islander' : 'islanders'} rated ${rating} stars`}
                            >
                                <div 
                                    className="w-full bg-gray-600 rounded-t transition-all duration-300 hover:bg-gray-500 cursor-pointer"
                                    style={{ height: `${barHeight}px` }}
                                    onClick={() => {
                                        // Mobile click functionality
                                        const tooltip = document.getElementById(`tooltip-${rating}`);
                                        if (tooltip) {
                                            tooltip.classList.toggle('opacity-100');
                                            setTimeout(() => {
                                                tooltip.classList.remove('opacity-100');
                                            }, 2000);
                                        }
                                    }}
                                >
                                    <div 
                                        id={`tooltip-${rating}`}
                                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                                    >
                                        {count} rated {rating}★
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {rating}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
} 