"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { FiEye } from "react-icons/fi";

interface WatchedStatusDisplayProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
}

export default function WatchedStatusDisplay({
    entityType,
    entityId,
}: WatchedStatusDisplayProps) {
    const { user } = useUser();
    const [watchedData, setWatchedData] = useState<{
        isWatched: boolean;
        watchedDate: Date | null;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkWatchedStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/watched/check`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entityType,
                    entityId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setWatchedData({
                    isWatched: data.isWatched,
                    watchedDate: data.watchedDate ? new Date(data.watchedDate) : null,
                });
            }
        } catch (error) {
            console.error("Error checking watched status:", error);
        } finally {
            setIsLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        if (user) {
            checkWatchedStatus();
        } else {
            setIsLoading(false);
        }
    }, [user, checkWatchedStatus]);

    if (!user || isLoading || !watchedData?.isWatched) {
        return null;
    }

    const formatDate = (date: Date) => {
        return format(date, "MMMM d, yyyy");
    };

    const getWatchedText = () => {
        if (!watchedData.watchedDate) return null;

        switch (entityType) {
            case "episode":
                return `You've watched on ${formatDate(watchedData.watchedDate)}`;
            case "season":
            case "show":
                return `You finished on ${formatDate(watchedData.watchedDate)}`;
            default:
                return null;
        }
    };

    const watchedText = getWatchedText();
    if (!watchedText) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-green-300">
            <FiEye className="w-4 h-4" />
            <span>{watchedText}</span>
        </div>
    );
} 