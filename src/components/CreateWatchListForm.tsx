"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiX, FiTag, FiTrash2, FiMove, FiLoader, FiChevronUp, FiChevronDown } from "react-icons/fi";

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
}

export default function CreateWatchListForm() {
    const { user } = useUser();
    const router = useRouter();
    
    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [privacy, setPrivacy] = useState<"public" | "private" | "friends">("public");
    const [isRanked, setIsRanked] = useState(false);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Show[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Selected shows
    const [selectedShows, setSelectedShows] = useState<SelectedShow[]>([]);
    
    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
    // Form submission
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setSelectedShows(selectedShows.filter(s => s.id !== showId));
        // Reorder rankings if needed
        if (isRanked) {
            setSelectedShows(prev => 
                prev.filter(s => s.id !== showId).map((s, index) => ({
                    ...s,
                    ranking: index + 1
                }))
            );
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
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
        if (index === 0) return; // Can't move first item up
        
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
        if (index === selectedShows.length - 1) return; // Can't move last item down
        
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

    const handleSubmit = async () => {
        if (!user || !name.trim() || selectedShows.length === 0) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/watch-lists", {
                method: "POST",
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
                        ranking: show.ranking
                    }))
                }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/watch-lists/${data.watchListId}`);
            } else {
                const error = await response.json();
                console.error("Failed to create watch list:", error);
            }
        } catch (error) {
            console.error("Error creating watch list:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = name.trim() && selectedShows.length > 0;

    return (
        <div className="bg-gray-700 rounded-lg max-w-6xl mx-auto">
            <div className="p-3 md:p-8">
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
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400"
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
                                            className="hover:text-red-200"
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
                                    className="flex-grow px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400"
                                />
                                <button
                                    onClick={handleAddTag}
                                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
                                        className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 focus:ring-green-500"
                                    />
                                    <span className="ml-2 text-white">Public - Anyone can view</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="friends"
                                        checked={privacy === "friends"}
                                        onChange={(e) => setPrivacy(e.target.value as "friends")}
                                        className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 focus:ring-green-500"
                                    />
                                    <span className="ml-2 text-white">Friends Only - Only your friends can view</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="private"
                                        checked={privacy === "private"}
                                        onChange={(e) => setPrivacy(e.target.value as "private")}
                                        className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 focus:ring-green-500"
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
                                    onChange={(e) => setIsRanked(e.target.checked)}
                                    className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500 focus:ring-2"
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
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Add Shows Section */}
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => document.getElementById('show-search')?.focus()}
                            className="px-2 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
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
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400"
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
                        <div className="bg-gray-600 rounded-md p-2 md:p-4">
                            <h3 className="text-white font-medium mb-3">
                                Selected Shows ({selectedShows.length})
                            </h3>
                            <div className="space-y-2">
                                {selectedShows.map((show, index) => (
                                    <div
                                        key={show.id}
                                        draggable={isRanked}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-md transition-all duration-200 ${
                                            isRanked ? 'cursor-move' : ''
                                        } ${
                                            draggedIndex === index 
                                                ? 'opacity-50 bg-gray-400' 
                                                : dragOverIndex === index 
                                                ? 'bg-green-600 border-2 border-green-400' 
                                                : 'bg-gray-500'
                                        }`}
                                    >
                                        {isRanked && (
                                            <FiMove className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                                                    <span className="text-gray-400">Not rated</span>
                                                )}
                                            </div>
                                            {isRanked && (
                                                <div className="flex flex-col md:hidden">
                                                    <button
                                                        onClick={() => moveShowUp(index)}
                                                        disabled={index === 0}
                                                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <FiChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveShowDown(index)}
                                                        disabled={index === selectedShows.length - 1}
                                                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <FiChevronDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleRemoveShow(show.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
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

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-600 mt-8">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isFormValid}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <FiLoader className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Watch List"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
} 