"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { FiX, FiPlus, FiSearch } from "react-icons/fi";

interface WatchList {
    id: number;
    name: string;
    description?: string | null;
    createdAt: Date;
    isPublic: boolean;
    friendsOnly: boolean;
}

interface AddToWatchListModalProps {
    isOpen: boolean;
    onClose: () => void;
    showId: number;
    showName: string;
}

export default function AddToWatchListModal({ isOpen, onClose, showId, showName }: AddToWatchListModalProps) {
    const { user } = useUser();
    const router = useRouter();
    
    const [watchLists, setWatchLists] = useState<WatchList[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Fetch user's watch lists
    useEffect(() => {
        if (isOpen && user) {
            const fetchWatchLists = async () => {
                try {
                    const response = await fetch(`/api/users/${user?.username}/watch-lists`);
                    if (response.ok) {
                        const data = await response.json();
                        setWatchLists(data.watchLists || []);
                    }
                } catch (error) {
                    console.error("Error fetching watch lists:", error);
                }
            };
            fetchWatchLists();
            setErrorMessage(null);
        }
    }, [isOpen, user]);

 
    useEffect(() => {
        const fetchWatchLists = async () => {
            try {
                const response = await fetch(`/api/users/${user?.username}/watch-lists`);
                if (response.ok) {
                    const data = await response.json();
                    setWatchLists(data.watchLists || []);
                }
            } catch (error) {
                console.error("Error fetching watch lists:", error);
            }
        };
    
        const searchWatchLists = async (query: string) => {
            if (!query.trim()) {
                fetchWatchLists();
                return;
            }
    
            setIsSearching(true);
            try {
                const response = await fetch(`/api/users/${user?.username}/watch-lists/search?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const data = await response.json();
                    setWatchLists(data.watchLists || []);
                }
            } catch (error) {
                console.error("Error searching watch lists:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(() => {
            searchWatchLists(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, user?.username]);

    const handleAddToWatchList = async (watchListId: number) => {
        setIsAdding(true);
        setErrorMessage(null);
        try {
            const response = await fetch(`/api/watch-lists/${watchListId}/shows`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    showId: showId,
                }),
            });

            if (response.ok) {
                router.push(`/${user?.username}/watch-list/${watchListId}`);
            } else {
                const errorData = await response.json();
                if (response.status === 400 && errorData.error === "Show already in watch list") {
                    const watchList = watchLists.find(wl => wl.id === watchListId);
                    setErrorMessage(`Show already on '${watchList?.name}' watch list`);
                } else {
                    setErrorMessage("Failed to add show to watch list");
                }
            }
        } catch (error) {
            console.error("Error adding show to watch list:", error);
            setErrorMessage("Failed to add show to watch list");
        } finally {
            setIsAdding(false);
        }
    };

    const handleCreateNewWatchList = () => {
        router.push(`/watch-list/new?showId=${showId}`);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getPrivacyStatus = (isPublic: boolean, friendsOnly: boolean) => {
        if (friendsOnly) return "Friends Only";
        if (isPublic) return "Public";
        return "Private";
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-700 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-white">
                        Add &quot;{showName}&quot; to a Watch List
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-600 text-white rounded-md text-sm relative">
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="absolute top-1 right-1 text-white hover:text-gray-200 transition-colors"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                            <div className="pr-6">
                                {errorMessage}
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <FiSearch className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your watch lists..."
                                className="flex-grow px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 text-sm"
                            />
                        </div>
                    </div>

                    {/* Watch Lists */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {/* Add to New Watch List */}
                        <button
                            onClick={handleCreateNewWatchList}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-600 rounded-md transition-colors text-left"
                        >
                            <FiPlus className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-white font-medium">Add to new Watch List</span>
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-600"></div>
                        {isSearching ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mx-auto"></div>
                                <p className="text-gray-400 text-sm mt-2">Searching...</p>
                            </div>
                        ) : watchLists.length > 0 ? (
                            watchLists.map((watchList) => (
                                                                 <button
                                     key={watchList.id}
                                     onClick={() => handleAddToWatchList(watchList.id)}
                                     disabled={isAdding}
                                     className="w-full flex flex-col gap-1 p-3 hover:bg-gray-600 rounded-md transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     <div className="flex items-start justify-between min-w-0">
                                         <div className="flex-1 min-w-0">
                                             <span className="text-white font-medium truncate block">
                                                 {watchList.name}
                                             </span>
                                             {watchList.description && (
                                                 <p className="text-gray-300 text-sm truncate mt-1">
                                                     {watchList.description}
                                                 </p>
                                             )}
                                             <span className="text-gray-400 text-xs block mt-1">
                                                 {getPrivacyStatus(watchList.isPublic, watchList.friendsOnly)}
                                             </span>
                                         </div>
                                         <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                                             {formatDate(watchList.createdAt)}
                                         </span>
                                     </div>
                                 </button>
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-400 text-sm">
                                    {searchQuery ? "No watch lists found" : "No watch lists yet"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 