"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FiX, FiEdit3 } from "react-icons/fi";

interface CompletionReviewPromptProps {
    entityType: "season" | "show";
    entityId: number;
    entityName: string;
    showId?: number;
    seasonNumber?: number;
}

export default function CompletionReviewPrompt({
    entityType,
    entityId,
    entityName,
    showId,
    seasonNumber,
}: CompletionReviewPromptProps) {
    const { user } = useUser();
    const router = useRouter();
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const handleSeasonCompleted = (event: CustomEvent) => {
            if (entityType === "season" && event.detail.seasonId === entityId) {
                setShowNotification(true);
            }
        };

        const handleShowCompleted = (event: CustomEvent) => {
            if (entityType === "show" && event.detail.showId === entityId) {
                setShowNotification(true);
            }
        };

        window.addEventListener('seasonCompleted', handleSeasonCompleted as EventListener);
        window.addEventListener('showCompleted', handleShowCompleted as EventListener);

        return () => {
            window.removeEventListener('seasonCompleted', handleSeasonCompleted as EventListener);
            window.removeEventListener('showCompleted', handleShowCompleted as EventListener);
        };
    }, [entityType, entityId]);

    const handleGoToPage = () => {
        setShowNotification(false);
        
        if (entityType === "season" && showId && seasonNumber !== undefined) {
            // Navigate to season page
            router.push(`/show/${showId}/season/${seasonNumber}`);
        } else if (entityType === "show") {
            // Navigate to show page
            router.push(`/show/${entityId}`);
        }
    };

    const handleMaybeLater = () => {
        setShowNotification(false);
    };

    if (!showNotification || !user) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-sm bg-gradient-to-r from-green-600 to-green-700 text-white p-4 md:p-6 rounded-lg shadow-lg z-50">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm md:text-lg">🎉</span>
                        </div>
                        <h3 className="font-bold text-base md:text-lg truncate">
                            Congratulations!
                        </h3>
                    </div>
                    
                    <p className="text-xs md:text-sm mb-3 md:mb-4 leading-relaxed">
                        {entityType === "season" 
                            ? `You've finished watching ${entityName}!`
                            : `You've finished watching ${entityName}!`
                        }
                    </p>
                    
                    <p className="text-xs md:text-sm mb-3 md:mb-4 text-green-100">
                        Would you like to visit the {entityType} page and write a review?
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={handleGoToPage}
                            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white text-green-700 rounded font-medium hover:bg-gray-100 transition-colors text-xs md:text-sm"
                        >
                            <FiEdit3 className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="truncate">Take me to {entityType === "season" ? "season" : "show"} page</span>
                        </button>
                        <button
                            onClick={handleMaybeLater}
                            className="px-3 py-2 md:px-4 md:py-2 text-green-100 hover:text-white transition-colors text-xs md:text-sm"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
                
                <button
                    onClick={handleMaybeLater}
                    className="text-green-100 hover:text-white transition-colors ml-2 flex-shrink-0"
                >
                    <FiX className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </div>
        </div>
    );
} 