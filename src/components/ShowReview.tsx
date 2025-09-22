"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { format } from "date-fns";
import RatingComponent from "./RatingComponent";
import { FiX, FiTag, FiUser, FiLoader, FiChevronRight } from "react-icons/fi";
import { GiRose } from "react-icons/gi";
import { useModalScrollPrevention } from "@/hooks/useModalScrollPrevention";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface ShowReviewProps {
    show: {
        id: number;
        name: string;
        posterPath?: string | null;
        firstAirDate?: Date | null;
        characters?: {
            id: number;
            name: string;
            characterName?: string | null;
            profilePath?: string | null;
            seasonId: number;
            seasonNumber: number;
        }[];
    };
    isOpen: boolean;
    onClose: () => void;
}

export default function ShowReview({ show, isOpen, onClose }: ShowReviewProps) {
    const { user } = useUser();
    
    // Prevent background scrolling when modal is open
    useModalScrollPrevention(isOpen);
    
    // Handle escape key to close modal
    useEscapeKey(isOpen, onClose);
    const [startedOn, setStartedOn] = useState<string>("");
    const [endedOn, setEndedOn] = useState<string>("");
    const [reviewContent, setReviewContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [spoiler, setSpoiler] = useState(false);
    const [favouriteCharacters, setFavouriteCharacters] = useState<number[]>(
        []
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(
        new Set()
    );

    // Date validation
    const today = new Date().toISOString().split("T")[0];
    const isStartedDateValid = !startedOn || startedOn <= today;
    const isEndedDateValid = !endedOn || endedOn <= today;
    const isDateRangeValid = !startedOn || !endedOn || startedOn <= endedOn;
    const isFormValid =
        reviewContent.trim() &&
        isStartedDateValid &&
        isEndedDateValid &&
        isDateRangeValid;

    const formatDate = (date: Date | null) =>
        date ? format(date, "MMMM d, yyyy") : null;

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleCharacterToggle = (characterId: number) => {
        setFavouriteCharacters((prev) =>
            prev.includes(characterId)
                ? prev.filter((id) => id !== characterId)
                : [...prev, characterId]
        );
    };

    const toggleSeasonExpansion = (seasonId: number) => {
        setExpandedSeasons((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(seasonId)) {
                newSet.delete(seasonId);
            } else {
                newSet.add(seasonId);
            }
            return newSet;
        });
    };

    // Group characters by season
    const charactersBySeason =
        show.characters?.reduce((acc, character) => {
            if (!acc[character.seasonId]) {
                acc[character.seasonId] = {
                    seasonId: character.seasonId,
                    seasonNumber: character.seasonNumber,
                    characters: [],
                };
            }
            acc[character.seasonId].characters.push(character);
            return acc;
        }, {} as Record<number, { seasonId: number; seasonNumber: number; characters: typeof show.characters }>) ||
        {};

    const handleSubmit = async () => {
        if (!user || !reviewContent.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/reviews/show", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    showId: show.id,
                    content: reviewContent.trim(),
                    startedOn: startedOn || null,
                    endedOn: endedOn || null,
                    tags: tags,
                    spoiler: spoiler,
                    favouriteCharacters: favouriteCharacters,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Reset form
                setStartedOn("");
                setEndedOn("");
                setReviewContent("");
                setTags([]);
                setSpoiler(false);
                setFavouriteCharacters([]);
                onClose();

                // Show success message with link to view full review
                if (data.reviewId) {
                    alert(
                        `Review submitted successfully! Click OK to view your review of the show.`
                    );
                    window.location.href = `/${user.username}/review/show/${data.reviewId}`;
                }
            } else {
                const error = await response.json();
                console.error("Failed to submit review:", error);
                // You can add an error toast here
            }
        } catch (error) {
            console.error("Error submitting review:", error);
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
                    const response = await fetch(
                        `/api/favourites?entityType=show&entityId=${show.id}`
                    );
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
    }, [isOpen, user, show.id]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 md:bg-white/5 md:backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-white">
                        Write a Show Review
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="modal-content p-6 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Side - Show Info */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                            {/* Rating above poster */}
                            <div className="mb-4">
                                <RatingComponent
                                    entityType="show"
                                    entityId={show.id}
                                />
                            </div>

                            {/* Poster - Hidden on mobile, visible on desktop */}
                            <div className="hidden md:block relative w-32 h-48 md:w-48 md:h-72 rounded-lg overflow-hidden shadow-lg">
                                <Image
                                    src={
                                        show.posterPath
                                            ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
                                            : "/noPoster.jpg"
                                    }
                                    alt={`${show.name} poster`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-sm font-bold text-white">
                                    {show.name}
                                </h3>
                                {show.firstAirDate && (
                                    <p className="text-sm text-gray-300 mt-1">
                                        First aired on{" "}
                                        {formatDate(show.firstAirDate)}
                                    </p>
                                )}
                            </div>
                            {/* Favorite Status */}
                            <div className="flex flex-col items-center gap-4 mt-4">
                                <p className="text-sm text-gray-300 text-center">
                                    {isFavorited
                                        ? "You have given this show a rose"
                                        : "You have not given this show a rose"}
                                </p>
                                <GiRose
                                    className={`w-5 h-5 ${
                                        isFavorited
                                            ? "text-rose-500"
                                            : "text-gray-400"
                                    }`}
                                />
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
                                    onChange={(e) =>
                                        setReviewContent(e.target.value)
                                    }
                                    placeholder="Share your thoughts about this show..."
                                    rows={6}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400 resize-none"
                                />
                            </div>

                            {/* Date Inputs */}
                            <div className="flex justify-between gap-2 h-20">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Started On
                                    </label>
                                    <input
                                        type="date"
                                        value={startedOn}
                                        onChange={(e) =>
                                            setStartedOn(e.target.value)
                                        }
                                        max={today}
                                        className={`w-32 md:w-full px-2 py-1 md:px-3 md:py-2 bg-gray-600 border rounded-md text-white focus:outline-none text-xs md:text-sm [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-200 ${
                                            !isStartedDateValid
                                                ? "border-red-500 focus:border-red-400"
                                                : "border-gray-500 focus:border-green-400"
                                        }`}
                                        style={
                                            {
                                                colorScheme: "dark",
                                                "--webkit-datetime-edit-fields-wrapper":
                                                    "color: white",
                                                "--webkit-datetime-edit-text":
                                                    "color: white",
                                                "--webkit-datetime-edit-month-field":
                                                    "color: white",
                                                "--webkit-datetime-edit-day-field":
                                                    "color: white",
                                                "--webkit-datetime-edit-year-field":
                                                    "color: white",
                                            } as React.CSSProperties
                                        }
                                    />
                                    {!isStartedDateValid && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">
                                            Hmm...
                                        </p>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Ended On
                                    </label>
                                    <input
                                        type="date"
                                        value={endedOn}
                                        onChange={(e) =>
                                            setEndedOn(e.target.value)
                                        }
                                        max={today}
                                        min={startedOn || undefined}
                                        className={`w-32 md:w-full px-2 py-1 md:px-3 md:py-2 bg-gray-600 border rounded-md text-white focus:outline-none text-xs md:text-sm [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-200 ${
                                            !isEndedDateValid
                                                ? "border-red-500 focus:border-red-400"
                                                : "border-gray-500 focus:border-green-400"
                                        }`}
                                        style={
                                            {
                                                colorScheme: "dark",
                                                "--webkit-datetime-edit-fields-wrapper":
                                                    "color: white",
                                                "--webkit-datetime-edit-text":
                                                    "color: white",
                                                "--webkit-datetime-edit-month-field":
                                                    "color: white",
                                                "--webkit-datetime-edit-day-field":
                                                    "color: white",
                                                "--webkit-datetime-edit-year-field":
                                                    "color: white",
                                            } as React.CSSProperties
                                        }
                                    />
                                    {!isEndedDateValid && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">
                                            Time traveler?
                                        </p>
                                    )}
                                    {!isDateRangeValid && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">
                                            Hmm...
                                        </p>
                                    )}
                                </div>
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
                                                    onClick={() =>
                                                        handleRemoveTag(tag)
                                                    }
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
                                            onChange={(e) =>
                                                setNewTag(e.target.value)
                                            }
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
                                            onChange={(e) =>
                                                setSpoiler(e.target.checked)
                                            }
                                            className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500 focus:ring-2"
                                        />
                                        <label
                                            htmlFor="spoiler"
                                            className="ml-2 text-sm text-gray-300"
                                        >
                                            Contains spoilers
                                        </label>
                                    </div>
                                </div>

                                {/* Favourite Characters */}
                                {show.characters &&
                                    show.characters.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Favourite &apos;Characters&apos;
                                            </label>
                                            <div className="max-h-64 overflow-y-auto space-y-2">
                                                {Object.values(
                                                    charactersBySeason
                                                )
                                                    .sort(
                                                        (a, b) =>
                                                            a.seasonNumber -
                                                            b.seasonNumber
                                                    )
                                                    .map((season) => (
                                                        <div
                                                            key={
                                                                season.seasonId
                                                            }
                                                        >
                                                            {/* Season Header */}
                                                            <div
                                                                className="flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer bg-gray-800 hover:bg-gray-700"
                                                                onClick={() =>
                                                                    toggleSeasonExpansion(
                                                                        season.seasonId
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2 flex-grow">
                                                                    <span className="text-sm font-medium text-white">
                                                                        {season.seasonNumber ===
                                                                        0
                                                                            ? "Specials"
                                                                            : `Season ${season.seasonNumber}`}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">
                                                                        (
                                                                        {
                                                                            season
                                                                                .characters
                                                                                .length
                                                                        }{" "}
                                                                        characters)
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className={`transform transition-transform ${
                                                                        expandedSeasons.has(
                                                                            season.seasonId
                                                                        )
                                                                            ? "rotate-90"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <FiChevronRight className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            </div>

                                                            {/* Characters in Season */}
                                                            {expandedSeasons.has(
                                                                season.seasonId
                                                            ) && (
                                                                <div className="ml-4 space-y-1 mt-1">
                                                                    {season.characters.map(
                                                                        (
                                                                            character
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    character.id
                                                                                }
                                                                                className={`flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer ${
                                                                                    favouriteCharacters.includes(
                                                                                        character.id
                                                                                    )
                                                                                        ? "bg-green-600 hover:bg-green-500"
                                                                                        : "bg-gray-600 hover:bg-gray-500"
                                                                                }`}
                                                                                onClick={() =>
                                                                                    handleCharacterToggle(
                                                                                        character.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                <div className="flex items-center gap-2 flex-grow">
                                                                                    {character.profilePath ? (
                                                                                        <Image
                                                                                            src={`https://image.tmdb.org/t/p/w45${character.profilePath}`}
                                                                                            alt={
                                                                                                character.name
                                                                                            }
                                                                                            width={
                                                                                                24
                                                                                            }
                                                                                            height={
                                                                                                24
                                                                                            }
                                                                                            className="rounded-full object-cover"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                                                                                            <FiUser className="w-3 h-3 text-gray-300" />
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-sm text-white font-medium">
                                                                                            {
                                                                                                character.name
                                                                                            }
                                                                                        </span>
                                                                                        {character.characterName && (
                                                                                            <span className="text-xs text-gray-300">
                                                                                                as{" "}
                                                                                                {
                                                                                                    character.characterName
                                                                                                }
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
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
