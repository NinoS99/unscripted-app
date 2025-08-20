"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { updateUserProfile } from "@/lib/actions";
import Image from "next/image";
import { FiX } from "react-icons/fi";

export default function EditProfileForm({ onClose }: { onClose: () => void }) {
    const { user } = useUser();
    const [formData, setFormData] = useState({
        bio: "",
        twitter: "",
        instagram: "",
    });
    const [originalData, setOriginalData] = useState({
        bio: "",
        twitter: "",
        instagram: "",
    });
    const [topFourShows, setTopFourShows] = useState<
        Array<{
            id: number;
            position: number;
            show: {
                id: number;
                name: string;
                posterPath: string | null;
                tmdbId: number;
            };
        }>
    >([]);
    const [originalTopFourShows, setOriginalTopFourShows] = useState<
        Array<{
            id: number;
            position: number;
            show: {
                id: number;
                name: string;
                posterPath: string | null;
                tmdbId: number;
            };
        }>
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSaveTooltip, setShowSaveTooltip] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<
        Array<{
            id: number;
            name: string;
            posterPath: string | null;
            tmdbId: number;
        }>
    >([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    // Check if form has changes
    const hasChanges =
        formData.bio !== originalData.bio ||
        formData.twitter !== originalData.twitter ||
        formData.instagram !== originalData.instagram ||
        JSON.stringify(topFourShows) !== JSON.stringify(originalTopFourShows);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const [profileResponse, topFourResponse] = await Promise.all([
                    fetch(`/api/profile/${user.id}`),
                    fetch(`/api/users/top-four-shows?userId=${user.id}`),
                ]);

                const profileData = await profileResponse.json();
                const topFourData = await topFourResponse.json();

                const defaultData = {
                    bio: profileData.bio || "",
                    twitter: profileData.twitter || "",
                    instagram: profileData.instagram || "",
                };

                setFormData(defaultData);
                setOriginalData(defaultData);
                setTopFourShows(topFourData.topFourShows || []);
                setOriginalTopFourShows(topFourData.topFourShows || []);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            // Transform empty strings to null before sending
            const dataToSend = {
                bio: formData.bio.trim() || null,
                twitter: formData.twitter.trim() || null,
                instagram: formData.instagram.trim() || null,
            };

            // Save profile and top four shows in parallel
            const [, topFourResponse] = await Promise.all([
                updateUserProfile(user.id, dataToSend),
                fetch("/api/users/top-four-shows", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        showIds: topFourShows.map((show) => show.show.id),
                    }),
                }),
            ]);

            if (topFourResponse.ok) {
                const topFourData = await topFourResponse.json();
                setTopFourShows(topFourData.topFourShows);
                setOriginalTopFourShows(topFourData.topFourShows);
            }

            // Update original data to current values after successful save
            setOriginalData(formData);
            setShowSaveTooltip(true);
            setTimeout(() => setShowSaveTooltip(false), 2000); // Hide tooltip after 2 seconds
        } catch (error) {
            console.error("Failed to save profile:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData(originalData); // Revert to original values
        setTopFourShows(originalTopFourShows); // Revert top four shows
        setSearchQuery(""); // Clear search
        setSearchResults([]); // Clear search results
    };

    // Construct social media URLs
    const twitterUrl = formData.twitter
        ? `https://twitter.com/${formData.twitter.replace("@", "")}`
        : null;

    const instagramUrl = formData.instagram
        ? `https://instagram.com/${formData.instagram.replace("@", "")}`
        : null;

    // Search shows
    const searchShows = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(
                `/api/search?q=${encodeURIComponent(query)}&type=show&limit=10`
            );
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.shows || []);
            }
        } catch (error) {
            console.error("Error searching shows:", error);
        }
    };

    // Add show to top four
    const addShow = (show: {
        id: number;
        name: string;
        posterPath: string | null;
        tmdbId: number;
    }) => {
        if (topFourShows.length >= 4) return;

        const newShow = {
            id: Date.now(), // Temporary ID
            position: topFourShows.length + 1,
            show: {
                id: show.id,
                name: show.name,
                posterPath: show.posterPath,
                tmdbId: show.tmdbId,
            },
        };

        setTopFourShows([...topFourShows, newShow]);
        setSearchQuery("");
        setSearchResults([]);
    };

    // Remove show from top four
    const removeShow = (position: number) => {
        setTopFourShows((prev) =>
            prev
                .filter((show) => show.position !== position)
                .map((show, index) => ({ ...show, position: index + 1 }))
        );
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        setTopFourShows((prev) => {
            const newShows = [...prev];
            const draggedShow = newShows[draggedIndex];

            // Remove dragged item
            newShows.splice(draggedIndex, 1);

            // Insert at new position
            newShows.splice(dropIndex, 0, draggedShow);

            // Update positions
            newShows.forEach((show, index) => {
                show.position = index + 1;
            });

            return newShows;
        });

        setDraggedIndex(null);
        setIsDragging(false);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setIsDragging(false);
    };

    // Handle search input change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchShows(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Detect screen size for drag functionality
    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth > 768);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);

        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    if (isLoading)
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-600 rounded-lg p-6 w-full max-w-md">
                    <p>Loading profile data...</p>
                </div>
            </div>
        );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col my-8 sm:my-4">
                {/* Header with close button */}
                <div className="border-b border-gray-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Edit Profile
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 -mr-2 cursor-pointer transition-colors"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bio Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-white text-sm">
                                    Bio
                                </h3>
                                <span className="text-xs text-gray-400">
                                    Max 150 characters
                                </span>
                            </div>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        bio: e.target.value,
                                    })
                                }
                                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:border-green-400 text-white text-sm"
                                rows={3}
                                maxLength={150}
                                placeholder="Tell us about yourself"
                            />
                        </div>

                        {/* Divider */}
                        <div className="border-b border-gray-600"></div>

                        {/* Top Four Shows Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-white text-sm">
                                    Top 4 Shows
                                </h3>
                                <span className="text-xs text-gray-400">
                                    Your all-time favorites
                                </span>
                            </div>
                            <div className="bg-gray-800 border border-gray-600 rounded-md p-4">
                                {/* Search Input - Only show when less than 4 shows are selected */}
                                {topFourShows.length < 4 && (
                                    <div className="relative mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search for shows to add..."
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-400 text-sm"
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded mt-1 max-h-60 overflow-y-auto z-10">
                                                {searchResults.map((show) => (
                                                    <button
                                                        key={show.id}
                                                        onClick={() =>
                                                            addShow(show)
                                                        }
                                                        disabled={topFourShows.some(
                                                            (tfs) =>
                                                                tfs.show.id ===
                                                                show.id
                                                        )}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Image
                                                            src={
                                                                show.posterPath
                                                                    ? `https://image.tmdb.org/t/p/w154${show.posterPath}`
                                                                    : "/noPoster.jpg"
                                                            }
                                                            alt={show.name}
                                                            width={32}
                                                            height={48}
                                                            className="rounded object-cover"
                                                        />
                                                        <span className="text-white text-left text-sm">
                                                            {show.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Top Four Shows Grid */}
                                {topFourShows.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-400 text-sm">
                                            Click the search above to select
                                            your top 4 shows
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {topFourShows.map((topShow, index) => (
                                            <div
                                                key={topShow.id}
                                                className={`relative group ${
                                                    isDragging &&
                                                    draggedIndex === index
                                                        ? "opacity-50"
                                                        : ""
                                                }`}
                                                draggable={isDesktop}
                                                onDragStart={(e) =>
                                                    handleDragStart(e, index)
                                                }
                                                onDragOver={handleDragOver}
                                                onDrop={(e) =>
                                                    handleDrop(e, index)
                                                }
                                                onDragEnd={handleDragEnd}
                                            >
                                                <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                                                    <Image
                                                        src={
                                                            topShow.show
                                                                .posterPath
                                                                ? `https://image.tmdb.org/t/p/w342${topShow.show.posterPath}`
                                                                : "/noPoster.jpg"
                                                        }
                                                        alt={topShow.show.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 15vw"
                                                    />
                                                    <div className="absolute top-0.5 left-0.5 bg-black bg-opacity-70 text-white text-xs px-0.5 py-0 rounded">
                                                        #{topShow.position}
                                                    </div>

                                                    {/* Drag handle - Desktop only */}
                                                    {isDesktop && (
                                                        <div className="absolute top-0.5 right-0.5 bg-gray-800 bg-opacity-70 text-white text-xs px-1 py-0.5 rounded cursor-move">
                                                            ⋮⋮
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            removeShow(
                                                                topShow.position
                                                            )
                                                        }
                                                        className="absolute bottom-0.5 right-0.5 bg-red-600 text-white rounded-full md:p-1 p-1 hover:bg-red-700 transition-colors"
                                                    >
                                                        <FiX className="w-2 h-2 md:w-2 md:h-2" />
                                                    </button>
                                                </div>

                                                <div className="mt-1">
                                                    <h4 className="text-white text-xs font-medium leading-tight break-words">
                                                        {topShow.show.name}
                                                    </h4>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-b border-gray-600"></div>

                        {/* Social Media Section */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-white text-sm">
                                Social Media
                            </h3>

                            {/* Twitter Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Twitter
                                </label>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 flex-shrink-0">
                                        {twitterUrl ? (
                                            <a
                                                href={twitterUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <svg
                                                    className="w-6 h-6 text-blue-400 hover:text-blue-300 transition-colors"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <svg
                                                className="w-6 h-6 text-blue-400"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-300">
                                                @
                                            </span>
                                            <input
                                                type="text"
                                                name="twitter"
                                                value={formData.twitter}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        twitter: e.target.value,
                                                    })
                                                }
                                                className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-r-md focus:outline-none focus:border-green-400 text-white text-sm"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Instagram Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Instagram
                                </label>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 flex-shrink-0">
                                        {instagramUrl ? (
                                            <a
                                                href={instagramUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <svg
                                                    className="w-6 h-6 text-pink-500 hover:text-pink-400 transition-colors"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <svg
                                                className="w-6 h-6 text-pink-500"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-300">
                                                @
                                            </span>
                                            <input
                                                type="text"
                                                name="instagram"
                                                value={formData.instagram}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        instagram:
                                                            e.target.value,
                                                    })
                                                }
                                                className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-r-md focus:outline-none focus:border-green-400 text-white text-sm"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer with buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={!hasChanges}
                                className={`px-4 py-2 rounded-md transition-colors text-sm ${
                                    hasChanges
                                        ? "text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                                        : "text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                Cancel
                            </button>
                            <div className="relative">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !hasChanges}
                                    className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm cursor-pointer ${
                                        !hasChanges &&
                                        "opacity-70 cursor-not-allowed"
                                    }`}
                                >
                                    {isSubmitting
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>
                                {showSaveTooltip && (
                                    <div className="absolute -top-10 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        Changes saved!
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-b-0 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
