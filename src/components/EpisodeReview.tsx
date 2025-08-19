"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { format } from "date-fns";
import RatingComponent from "./RatingComponent";
import { FiX, FiTag, FiLoader } from "react-icons/fi";
import { GiRose } from "react-icons/gi";

interface EpisodeReviewProps {
    episode: {
        id: number;
        episodeNumber: number;
        name: string;
        overview?: string | null;
        airDate?: Date | null;
        stillPath?: string | null;
        season: {
            id: number;
            seasonNumber: number;
            posterPath?: string | null;
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
    isOpen: boolean;
    onClose: () => void;
}

export default function EpisodeReview({ episode, isOpen, onClose }: EpisodeReviewProps) {
    const { user } = useUser();
    const [watchedOn, setWatchedOn] = useState<string>("");
    const [reviewContent, setReviewContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [spoiler, setSpoiler] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);

    // Date validation
    const today = new Date().toISOString().split('T')[0];
    const isWatchedDateValid = !watchedOn || watchedOn <= today;
    const isFormValid = reviewContent.trim() && isWatchedDateValid;

    const formatDate = (date: Date | null) =>
        date ? format(date, "MMMM d, yyyy") : null;

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

    const handleSubmit = async () => {
        if (!user || !reviewContent.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/reviews/episode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    episodeId: episode.id,
                    content: reviewContent.trim(),
                    watchedOn: watchedOn || null,
                    tags: tags,
                    spoiler: spoiler,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Reset form
                setWatchedOn("");
                setReviewContent("");
                setTags([]);
                setSpoiler(false);
                onClose();
                
                // Show success message with link to view full review
                if (data.reviewId) {
                    alert(
                        `Review submitted successfully! Click OK to view your review of the episode.`
                    );
                    window.location.href = `/${user.username}/review/episode/${data.reviewId}`;
                }
            } else {
                const error = await response.json();
                console.error("Failed to submit episode review:", error);
                // You can add an error toast here
            }
        } catch (error) {
            console.error("Error submitting episode review:", error);
            // You can add an error toast here
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check favorite status when modal opens
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (isOpen && user) {
                try {
                    const response = await fetch(`/api/favourites?entityType=episode&entityId=${episode.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setIsFavorited(data.isFavorite);
                    }
                } catch (error) {
                    console.error("Error checking favorite status:", error);
                }
            }
        };

        checkFavoriteStatus();
    }, [isOpen, user, episode.id]);

    // Close modal when clicking outside
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-white">Write an Episode Review</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Side - Episode Info */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                            {/* Rating above poster */}
                            <div className="mb-4">
                                <RatingComponent
                                    entityType="episode"
                                    entityId={episode.id}
                                />
                            </div>
                            
                            {/* Poster - Hidden on mobile, visible on desktop */}
                            <div className="hidden md:block relative w-32 h-48 md:w-48 md:h-72 rounded-lg overflow-hidden shadow-lg">
                                <Image
                                    src={
                                        episode.season.posterPath
                                            ? `https://image.tmdb.org/t/p/w500${episode.season.posterPath}`
                                            : episode.season.show.posterPath
                                            ? `https://image.tmdb.org/t/p/w500${episode.season.show.posterPath}`
                                            : "/noPoster.jpg"
                                    }
                                    alt={`${episode.season.show.name} ${episode.season.seasonNumber === 0 ? "Special " : `S${episode.season.seasonNumber}E`}${episode.episodeNumber} - ${episode.name}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-sm font-bold text-white">
                                    {episode.season.show.name} - {episode.season.seasonNumber === 0 ? "Special " : `S${episode.season.seasonNumber}E`}{episode.episodeNumber}
                                </h3>
                                <p className="text-sm text-gray-300 mt-1">
                                    {episode.name}
                                </p>
                                {episode.airDate && (
                                    <p className="text-sm text-gray-300 mt-1">
                                        Aired on {formatDate(episode.airDate)}
                                    </p>
                                )}
                            </div>
                                                         {/* Favorite Status */}
                             <div className="flex flex-col items-center gap-4 mt-4">
                                 <p className="text-sm text-gray-300 text-center">
                                     {isFavorited 
                                         ? "You have given this episode a rose" 
                                         : "You have not given this episode a rose"
                                     }
                                 </p>
                                 <GiRose className={`w-5 h-5 ${isFavorited ? 'text-rose-500' : 'text-gray-400'}`} />
                             </div>
                        </div>

                        {/* Right Side - Review Form */}
                        <div className="flex-grow space-y-4 md:space-y-6">
                            {/* Review Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Review *
                                </label>
                                <textarea
                                    value={reviewContent}
                                    onChange={(e) => setReviewContent(e.target.value)}
                                    placeholder="Share your thoughts about this episode..."
                                    rows={6}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none"
                                />
                            </div>

                                                         {/* Watched On Date */}
                             <div className="relative h-20">
                                 <label className="block text-sm font-medium text-gray-300 mb-2">
                                     Watched On
                                 </label>
                                 <input
                                     type="date"
                                     value={watchedOn}
                                     onChange={(e) => setWatchedOn(e.target.value)}
                                     max={today}
                                     className={`w-32 px-2 py-1 md:px-3 md:py-2 bg-gray-600 border rounded-md text-white focus:outline-none text-xs md:text-sm [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-200 ${
                                         !isWatchedDateValid ? 'border-red-500 focus:border-red-400' : 'border-gray-500 focus:border-green-400'
                                     }`}
                                    style={{
                                        colorScheme: 'dark',
                                        '--webkit-datetime-edit-fields-wrapper': 'color: white',
                                        '--webkit-datetime-edit-text': 'color: white',
                                        '--webkit-datetime-edit-month-field': 'color: white',
                                        '--webkit-datetime-edit-day-field': 'color: white',
                                        '--webkit-datetime-edit-year-field': 'color: white',
                                    } as React.CSSProperties}
                                />
                                {!isWatchedDateValid && (
                                    <p className="text-red-400 text-xs mt-1 ml-1">Date error!</p>
                                )}
                            </div>

                            {/* Tags and Favourite Characters */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                    
                                    {/* Spoiler Checkbox */}
                                    <div className="flex items-center mt-4">
                                        <input
                                            type="checkbox"
                                            id="spoiler"
                                            checked={spoiler}
                                            onChange={(e) => setSpoiler(e.target.checked)}
                                            className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500 focus:ring-2"
                                        />
                                        <label htmlFor="spoiler" className="ml-2 text-sm text-gray-300">
                                            Contains spoilers
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Submit and Cancel Buttons */}
                            <div className="flex justify-between pt-4 border-t border-gray-600">
                                <button
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !isFormValid}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FiLoader className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Review"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 