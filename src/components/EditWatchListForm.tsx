"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiX, FiTag, FiTrash2, FiMove, FiLoader, FiChevronUp, FiChevronDown } from "react-icons/fi";
import DeleteEntityModal from "./DeleteEntityModal";

interface Show {
    id: number;
    name: string;
    posterPath?: string | null;
    firstAirDate?: Date | null;
    tmdbRating?: number | null;
}

interface SelectedShow extends Show {
    ranking?: number;
    userRating?: number | null;
    note?: string;
    spoiler?: boolean;
    muchWatchSeasons?: number[];
}

interface WatchListShow {
    id: number;
    ranking?: number | null;
    note?: string | null;
    spoiler?: boolean;
    show: {
        id: number;
        name: string;
        posterPath?: string | null;
        firstAirDate?: Date | null;
        tmdbRating?: number | null;
    };
    muchWatchSeasons: {
        season: {
            id: number;
            seasonNumber: number;
        };
    }[];
}

interface WatchList {
    id: number;
    name: string;
    description?: string | null;
    isPublic: boolean;
    friendsOnly: boolean;
    user: {
        id: string;
        username: string;
    };
    shows: WatchListShow[];
    tags: {
        tag: {
            id: number;
            name: string;
        };
    }[];
}

interface EditWatchListFormProps {
    watchList: WatchList;
}

export default function EditWatchListForm({ watchList }: EditWatchListFormProps) {
    const { user } = useUser();
    const router = useRouter();
    
    // Form state - pre-populated with existing data
    const [name, setName] = useState(watchList.name);
    const [description, setDescription] = useState(watchList.description || "");
    const [tags, setTags] = useState<string[]>(watchList.tags.map(t => t.tag.name));
    const [newTag, setNewTag] = useState("");
    const [privacy, setPrivacy] = useState<"public" | "private" | "friends">(
        watchList.friendsOnly ? "friends" : watchList.isPublic ? "public" : "private"
    );
    const [isRanked, setIsRanked] = useState(watchList.shows.some(s => s.ranking !== null));
    
    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Show[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Selected shows - pre-populated with existing shows
    const [selectedShows, setSelectedShows] = useState<SelectedShow[]>(
        watchList.shows.map(ws => ({
            id: ws.show.id,
            name: ws.show.name,
            posterPath: ws.show.posterPath,
            firstAirDate: ws.show.firstAirDate,
            tmdbRating: ws.show.tmdbRating,
            ranking: ws.ranking || undefined,
            note: ws.note || undefined,
            spoiler: ws.spoiler || false,
            muchWatchSeasons: ws.muchWatchSeasons.map(mws => mws.season.id)
        }))
    );
    
    // Track original state for change detection
    const originalState = {
        name: watchList.name,
        description: watchList.description || "",
        tags: watchList.tags.map(t => t.tag.name),
        privacy: watchList.friendsOnly ? "friends" : watchList.isPublic ? "public" : "private",
        isRanked: watchList.shows.some(s => s.ranking !== null),
        shows: watchList.shows.map(ws => ({
            id: ws.show.id,
            name: ws.show.name,
            posterPath: ws.show.posterPath,
            firstAirDate: ws.show.firstAirDate,
            tmdbRating: ws.show.tmdbRating,
            ranking: ws.ranking || undefined,
            note: ws.note || undefined,
            spoiler: ws.spoiler || false,
            muchWatchSeasons: ws.muchWatchSeasons.map(mws => mws.season.id)
        }))
    };
    
    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
    // Note modal state
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [editingShowIndex, setEditingShowIndex] = useState<number | null>(null);
    const [noteText, setNoteText] = useState("");
    const [noteSpoiler, setNoteSpoiler] = useState(false);
    const [selectedSeasons, setSelectedSeasons] = useState<number[]>([]);
    const [showSeasons, setShowSeasons] = useState<{id: number, seasonNumber: number}[]>([]);
    
    // Form submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Create a stable reference for the shows data
    const showsData = useMemo(() => watchList.shows, [watchList.shows]);

    // Fetch user ratings for initially populated shows
    useEffect(() => {
        const fetchUserRatings = async () => {
            const showsWithRatings = await Promise.all(
                showsData.map(async (ws) => {
                    try {
                        const response = await fetch(`/api/ratings?showId=${ws.show.id}`);
                        if (response.ok) {
                            const data = await response.json();
                            return {
                                id: ws.show.id,
                                name: ws.show.name,
                                posterPath: ws.show.posterPath,
                                firstAirDate: ws.show.firstAirDate,
                                tmdbRating: ws.show.tmdbRating,
                                ranking: ws.ranking || undefined,
                                note: ws.note || undefined,
                                spoiler: ws.spoiler || false,
                                muchWatchSeasons: ws.muchWatchSeasons.map(mws => mws.season.id),
                                userRating: data.showRating
                            };
                        }
                    } catch (error) {
                        console.error("Error fetching rating for show", ws.show.id, ":", error);
                    }
                    return {
                        id: ws.show.id,
                        name: ws.show.name,
                        posterPath: ws.show.posterPath,
                        firstAirDate: ws.show.firstAirDate,
                        tmdbRating: ws.show.tmdbRating,
                        ranking: ws.ranking || undefined,
                        note: ws.note || undefined,
                        spoiler: ws.spoiler || false,
                        muchWatchSeasons: ws.muchWatchSeasons.map(mws => mws.season.id)
                    };
                })
            );
            setSelectedShows(showsWithRatings);
        };

        if (showsData.length > 0) {
            fetchUserRatings();
        }
    }, [showsData]);

    // Check if form has changes
    const hasChanges = () => {
        const currentState = {
            name,
            description,
            tags: [...tags].sort(),
            privacy,
            isRanked,
            shows: selectedShows.map(s => ({
                id: s.id,
                name: s.name,
                posterPath: s.posterPath,
                firstAirDate: s.firstAirDate,
                tmdbRating: s.tmdbRating,
                ranking: s.ranking,
                note: s.note,
                spoiler: s.spoiler,
                muchWatchSeasons: s.muchWatchSeasons ? [...s.muchWatchSeasons].sort() : []
            }))
        };

        const originalStateNormalized = {
            ...originalState,
            tags: [...originalState.tags].sort(),
            shows: originalState.shows.map(s => ({
                ...s,
                muchWatchSeasons: s.muchWatchSeasons ? [...s.muchWatchSeasons].sort() : []
            }))
        };

        return JSON.stringify(currentState) !== JSON.stringify(originalStateNormalized);
    };

    const formatDateShort = (date: Date | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', { 
            year: '2-digit', 
            month: '2-digit', 
            day: '2-digit' 
        });
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    // Search shows
    const searchShows = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.shows || []);
                setShowDropdown(true);
            }
        } catch (error) {
            console.error("Error searching shows:", error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchShows(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleShowSelect = async (show: Show) => {
        if (!selectedShows.find(s => s.id === show.id)) {
            // Fetch user's rating for this show
            let userRating = null;
            try {
                const response = await fetch(`/api/ratings?showId=${show.id}`);
                if (response.ok) {
                    const data = await response.json();
                    userRating = data.showRating;
                }
            } catch (error) {
                console.error("Error fetching rating:", error);
            }

            const newShow: SelectedShow = {
                ...show,
                ranking: isRanked ? selectedShows.length + 1 : undefined,
                userRating
            };
            setSelectedShows([...selectedShows, newShow]);
        }
        setSearchQuery("");
        setShowDropdown(false);
    };

    const handleRemoveShow = (showId: number) => {
        // Prevent removal during submission or deletion
        if (isFormDisabled) return;
        
        setSelectedShows(prev => {
            const filteredShows = prev.filter(s => s.id !== showId);
            // Reorder rankings if needed
            if (isRanked) {
                return filteredShows.map((s, index) => ({
                    ...s,
                    ranking: index + 1
                }));
            }
            return filteredShows;
        });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        // Prevent drag start during submission or deletion
        if (isFormDisabled) {
            e.preventDefault();
            return;
        }
        
        e.dataTransfer.setData("text/plain", index.toString());
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIndex(index);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        
        // Prevent reordering during submission or deletion
        if (isFormDisabled) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        
        const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
        
        if (dragIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        setSelectedShows(prev => {
            const newShows = [...prev];
            const draggedShow = newShows[dragIndex];
            newShows.splice(dragIndex, 1);
            newShows.splice(dropIndex, 0, draggedShow);
            
            // Update rankings if needed
            if (isRanked) {
                return newShows.map((show, index) => ({
                    ...show,
                    ranking: index + 1
                }));
            }
            
            return newShows;
        });
        
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Arrow button handlers for mobile reordering
    const moveShowUp = (index: number) => {
        if (index === 0 || isFormDisabled) return; // Can't move first item up or during submission/deletion
        
        setSelectedShows(prev => {
            const newShows = [...prev];
            const show = newShows[index];
            newShows.splice(index, 1);
            newShows.splice(index - 1, 0, show);
            
            if (isRanked) {
                return newShows.map((show, index) => ({
                    ...show,
                    ranking: index + 1
                }));
            }
            
            return newShows;
        });
    };

    const moveShowDown = (index: number) => {
        if (index === selectedShows.length - 1 || isFormDisabled) return; // Can't move last item down or during submission/deletion
        
        setSelectedShows(prev => {
            const newShows = [...prev];
            const show = newShows[index];
            newShows.splice(index, 1);
            newShows.splice(index + 1, 0, show);
            
            if (isRanked) {
                return newShows.map((show, index) => ({
                    ...show,
                    ranking: index + 1
                }));
            }
            
            return newShows;
        });
    };

    const handleUpdate = async () => {
        if (!user || !name.trim() || selectedShows.length === 0) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/watch-lists/${watchList.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    tags,
                    isPublic: privacy === "public",
                    friendsOnly: privacy === "friends",
                    isRanked,
                    shows: selectedShows.map(show => ({
                        showId: show.id,
                        ranking: isRanked ? show.ranking : null,
                        note: show.note,
                        spoiler: show.spoiler,
                        muchWatchSeasons: show.muchWatchSeasons
                    }))
                }),
            });

            if (response.ok) {
                // Don't set isSubmitting to false here - let the navigation happen while form is still disabled
                router.push(`/${user?.username}/watch-list/${watchList.id}`);
            } else {
                const error = await response.json();
                console.error("Failed to update watch list:", error);
                setIsSubmitting(false); // Only reset if there was an error
            }
        } catch (error) {
            console.error("Error updating watch list:", error);
            setIsSubmitting(false); // Only reset if there was an error
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!user) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/watch-lists/${watchList.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.push("/watch-lists");
            } else {
                const error = await response.json();
                console.error("Failed to delete watch list:", error);
                setIsDeleting(false);
            }
        } catch (error) {
            console.error("Error deleting watch list:", error);
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const isFormValid = name.trim() && selectedShows.length > 0;
    const isFormDisabled = isSubmitting || isDeleting;

    // Note modal handlers
    const openNoteModal = async (showIndex: number) => {
        const show = selectedShows[showIndex];
        setEditingShowIndex(showIndex);
        setNoteText(show.note || "");
        setNoteSpoiler(show.spoiler || false);
        setSelectedSeasons(show.muchWatchSeasons || []);
        
        // Fetch seasons for this show
        try {
            const response = await fetch(`/api/shows/${show.id}/seasons`);
            if (response.ok) {
                const data = await response.json();
                setShowSeasons(data.seasons || []);
            }
        } catch (error) {
            console.error("Error fetching seasons:", error);
        }
        
        setNoteModalOpen(true);
    };

    const closeNoteModal = () => {
        setNoteModalOpen(false);
        setEditingShowIndex(null);
        setNoteText("");
        setNoteSpoiler(false);
        setSelectedSeasons([]);
        setShowSeasons([]);
    };

    const saveNote = () => {
        if (editingShowIndex !== null) {
            setSelectedShows(prev => prev.map((show, index) => 
                index === editingShowIndex 
                    ? { ...show, note: noteText, spoiler: noteSpoiler, muchWatchSeasons: selectedSeasons }
                    : show
            ));
        }
        closeNoteModal();
    };

    const toggleSeasonSelection = (seasonId: number) => {
        setSelectedSeasons(prev => {
            if (prev.includes(seasonId)) {
                return prev.filter(id => id !== seasonId);
            } else if (prev.length < 5) {
                return [...prev, seasonId];
            }
            return prev;
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-4">
                        Edit &apos;{watchList.name}&apos; Watch List
                    </h1>
                    <div className="border-b border-gray-600"></div>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side */}
                    <div className="flex-grow space-y-6">
                        {/* Watch List Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Watch List Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter a name for your watch list..."
                                disabled={isFormDisabled}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded-md"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            disabled={isFormDisabled}
                                            className="hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Add a tag..."
                                    disabled={isFormDisabled}
                                    className="flex-grow px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    onClick={handleAddTag}
                                    disabled={isFormDisabled}
                                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiTag className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Privacy Settings */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Who can view this watch list?
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="public"
                                        checked={privacy === "public"}
                                        onChange={(e) => setPrivacy(e.target.value as "public")}
                                        disabled={isFormDisabled}
                                        className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ accentColor: '#16a34a' }}
                                    />
                                    <span className="ml-2 text-white">Public - Anyone can view</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="friends"
                                        checked={privacy === "friends"}
                                        onChange={(e) => setPrivacy(e.target.value as "friends")}
                                        disabled={isFormDisabled}
                                        className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ accentColor: '#16a34a' }}
                                    />
                                    <span className="ml-2 text-white">Friends Only - Only your friends can view</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="private"
                                        checked={privacy === "private"}
                                        onChange={(e) => setPrivacy(e.target.value as "private")}
                                        disabled={isFormDisabled}
                                        className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ accentColor: '#16a34a' }}
                                    />
                                    <span className="ml-2 text-white">Private - Only you can view</span>
                                </label>
                            </div>
                        </div>

                        {/* Ranked List Checkbox */}
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isRanked}
                                    disabled={isFormDisabled}
                                    onChange={(e) => {
                                        const newIsRanked = e.target.checked;
                                        setIsRanked(newIsRanked);
                                        
                                        // Update show rankings based on checkbox state
                                        setSelectedShows(prev => prev.map((show, index) => ({
                                            ...show,
                                            ranking: newIsRanked ? index + 1 : undefined
                                        })));
                                    }}
                                    className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500 focus:ring-2"
                                    style={{ accentColor: '#16a34a' }}
                                />
                                <span className="ml-2 text-white">This is a ranked list</span>
                            </label>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your watch list..."
                                rows={12}
                                disabled={isFormDisabled}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Add Shows Section */}
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => document.getElementById('show-search')?.focus()}
                            disabled={isFormDisabled}
                            className="px-2 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Show
                        </button>
                        <div className="flex-grow relative">
                            <input
                                id="show-search"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for shows..."
                                disabled={isFormDisabled}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                onFocus={() => setShowDropdown(true)}
                            />
                            {isSearching && (
                                <FiLoader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                            )}
                            
                            {/* Search Results Dropdown */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-60 overflow-y-auto z-10">
                                    {searchResults.map((show) => (
                                        <div
                                            key={show.id}
                                            onClick={() => handleShowSelect(show)}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-500 cursor-pointer border-b border-gray-500 last:border-b-0"
                                        >
                                            <div className="flex-shrink-0 w-12 h-18">
                                                <Image
                                                    src={show.posterPath ? `https://image.tmdb.org/t/p/w92${show.posterPath}` : "/noPoster.jpg"}
                                                    alt={show.name}
                                                    width={48}
                                                    height={72}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h4 className="text-white font-medium truncate text-sm md:text-base">{show.name}</h4>
                                                {show.firstAirDate && (
                                                    <p className="text-gray-300 text-xs md:text-sm">
                                                        <span className="hidden md:inline">First aired </span>
                                                        {formatDateShort(show.firstAirDate)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Shows List */}
                    {selectedShows.length > 0 && (
                        <div className="bg-gray-900 rounded-md p-4">
                            <h3 className="text-white font-medium mb-3">
                                Selected Shows ({selectedShows.length})
                            </h3>
                            <div className="space-y-2">
                                {selectedShows.map((show, index) => (
                                    <div
                                        key={show.id}
                                        draggable={isRanked && !isFormDisabled}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-3 p-3 rounded-md transition-all duration-200 ${
                                            isRanked && !isFormDisabled ? 'cursor-move' : 'cursor-default'
                                        } ${
                                            isFormDisabled 
                                                ? 'opacity-60 bg-gray-600' 
                                                : draggedIndex === index 
                                                ? 'opacity-50 bg-gray-400' 
                                                : dragOverIndex === index 
                                                ? 'bg-green-600 border-2 border-green-400' 
                                                : 'bg-gray-500'
                                        }`}
                                    >
                                        {isRanked && (
                                            isFormDisabled ? (
                                                <FiLoader className="w-4 h-4 text-gray-400 flex-shrink-0 animate-spin" />
                                            ) : (
                                                <FiMove className="hidden md:block w-4 h-4 text-gray-400 flex-shrink-0" />
                                            )
                                        )}
                                        {isRanked && (
                                            <span className="text-green-400 font-bold text-sm w-6 text-center">
                                                #{index + 1}
                                            </span>
                                        )}
                                        <div className="flex-shrink-0 w-12 h-18">
                                            <Image
                                                src={show.posterPath ? `https://image.tmdb.org/t/p/w92${show.posterPath}` : "/noPoster.jpg"}
                                                alt={show.name}
                                                width={48}
                                                height={72}
                                                className="w-full h-full object-cover rounded"
                                            />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h4 className="text-white font-medium truncate text-sm md:text-base">{show.name}</h4>
                                            {show.firstAirDate && (
                                                <p className="text-gray-300 text-xs md:text-sm">
                                                    <span className="hidden md:inline">First aired </span>
                                                    {formatDateShort(show.firstAirDate)}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => openNoteModal(index)}
                                                disabled={isFormDisabled}
                                                className="text-green-400 hover:text-green-300 text-xs mt-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {show.note ? "Edit note" : "Add note"}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="hidden md:flex text-yellow-400 text-sm">
                                                {show.userRating ? (
                                                    Array.from({ length: 5 }, (_, i) => (
                                                        <span key={i}>
                                                            {i < Math.floor(show.userRating!) ? '★' : 
                                                             i === Math.floor(show.userRating!) && show.userRating! % 1 !== 0 ? '☆' : '☆'}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">Not rated by you</span>
                                                )}
                                            </div>
                                            {isRanked && (
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={() => moveShowUp(index)}
                                                        disabled={index === 0 || isFormDisabled}
                                                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <FiChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveShowDown(index)}
                                                        disabled={index === selectedShows.length - 1 || isFormDisabled}
                                                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <FiChevronDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleRemoveShow(show.id)}
                                                disabled={isFormDisabled}
                                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 pb-2 border-t border-gray-600 mt-8">
                    <button
                        onClick={handleDeleteClick}
                        disabled={isFormDisabled}
                        className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <FiTrash2 className="w-4 h-4" />
                        Delete Watch List
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => router.back()}
                            disabled={isFormDisabled}
                            className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={isFormDisabled || !isFormValid || !hasChanges()}
                            className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Watch List"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Note Modal */}
            {noteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-600">
                            <h2 className="text-xl font-bold text-white">Add Note</h2>
                            <button
                                onClick={closeNoteModal}
                                disabled={isFormDisabled}
                                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Note Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Note
                                </label>
                                <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Add any notes about this show..."
                                    rows={4}
                                    disabled={isFormDisabled}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Spoiler Checkbox */}
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={noteSpoiler}
                                        onChange={(e) => setNoteSpoiler(e.target.checked)}
                                        disabled={isFormDisabled}
                                        className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ accentColor: '#16a34a' }}
                                    />
                                    <span className="ml-2 text-white">Contains spoilers</span>
                                </label>
                            </div>

                            {/* Must-Watch Seasons */}
                            {showSeasons.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Must-Watch Seasons (select up to 5)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {showSeasons.map((season) => (
                                            <label
                                                key={season.id}
                                                className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                                                    selectedSeasons.includes(season.id)
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSeasons.includes(season.id)}
                                                    onChange={() => toggleSeasonSelection(season.id)}
                                                    className="w-4 h-4 mr-2"
                                                    disabled={(!selectedSeasons.includes(season.id) && selectedSeasons.length >= 5) || isFormDisabled}
                                                />
                                                <span className="text-sm">
                                                    {season.seasonNumber === 0 ? 'Specials' : `Season ${season.seasonNumber}`}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedSeasons.length >= 5 && (
                                        <p className="text-yellow-400 text-xs mt-2">
                                            Maximum 5 seasons selected
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                                <button
                                    onClick={closeNoteModal}
                                    disabled={isFormDisabled}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveNote}
                                    disabled={isFormDisabled}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteEntityModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
                entityType="watchList"
            />
        </div>
    );
} 