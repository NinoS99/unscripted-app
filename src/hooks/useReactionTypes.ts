import { useState, useEffect } from "react";

interface ReactionType {
    id: number;
    name: string;
    description?: string;
    emoji?: string | null;
    category?: string | null;
}

// Global cache for reaction types
let reactionTypesCache: Record<string, ReactionType[]> | null = null;
let isLoadingCache = false;
let cachePromise: Promise<Record<string, ReactionType[]>> | null = null;

export function useReactionTypes() {
    const [reactionTypes, setReactionTypes] = useState<Record<string, ReactionType[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchReactionTypes = async () => {
            // If we already have cached data, use it
            if (reactionTypesCache) {
                setReactionTypes(reactionTypesCache);
                return;
            }

            // If we're already loading, wait for the existing promise
            if (isLoadingCache && cachePromise) {
                try {
                    const data = await cachePromise;
                    setReactionTypes(data);
                } catch (error) {
                    console.error("Error fetching reaction types from cache:", error);
                }
                return;
            }

            // Start loading
            setIsLoading(true);
            isLoadingCache = true;

            // Create a new promise for this request
            cachePromise = (async () => {
                try {
                    const response = await fetch("/api/reaction-types");
                    if (response.ok) {
                        const data = await response.json();
                        reactionTypesCache = data.reactionTypes;
                        setReactionTypes(data.reactionTypes);
                        return data.reactionTypes;
                    } else {
                        throw new Error("Failed to fetch reaction types");
                    }
                } catch (error) {
                    console.error("Error fetching reaction types:", error);
                    throw error;
                } finally {
                    setIsLoading(false);
                    isLoadingCache = false;
                }
            })();

            try {
                await cachePromise;
            } catch (error) {
                console.error("Error in reaction types fetch:", error);
            }
        };

        fetchReactionTypes();
    }, []);

    return { reactionTypes, isLoading };
}
