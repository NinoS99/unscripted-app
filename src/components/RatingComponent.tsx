"use client";

import { useState, useEffect, useRef } from "react";
import {
    FaStar,
    FaRegStar,
    FaStarHalfAlt,
    FaTimes,
    FaPlus,
    FaCheck,
} from "react-icons/fa";

type RatingComponentProps = {
    entityType: "show" | "season" | "episode";
    entityId: number;
    onRatingChange?: (newRating: number) => void;
};

export default function RatingComponent({
    entityType,
    entityId,
    onRatingChange,
}: RatingComponentProps) {
    const [rating, setRating] = useState(0);
    const [tempRating, setTempRating] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileRatingModal, setShowMobileRatingModal] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const [hoverRating, setHoverRating] = useState<number>(0);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node)
            ) {
                setShowMobileRatingModal(false);
                setTempRating(0);
            }
        };
        if (showMobileRatingModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showMobileRatingModal]);

    useEffect(() => {
        const fetchRating = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(
                    `/api/ratings?${entityType}Id=${entityId}`
                );
                if (!response.ok)
                    throw new Error(
                        `Failed to fetch rating: ${response.status}`
                    );
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                const fetchedRating =
                    entityType === "show"
                        ? data.showRating
                        : entityType === "season"
                        ? data.seasonRating
                        : data.episodeRating;

                setRating(fetchedRating || 0);
            } catch (err) {
                console.error("Rating fetch error:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load rating"
                );
                setRating(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRating();
    }, [entityType, entityId]);

    const handleRating = async (newRating: number) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/ratings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    [`${entityType}Id`]: entityId,
                    rating: newRating,
                }),
            });

            if (!response.ok)
                throw new Error(`Failed to submit rating: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setRating(data.rating);
            setHoverRating(0);
            if (onRatingChange) onRatingChange(data.rating);
            if (isMobile) {
                setShowMobileRatingModal(false);
                setTempRating(0);
            }
        } catch (err) {
            console.error("Rating submit error:", err);
            setError(
                err instanceof Error ? err.message : "Failed to submit rating"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveRating = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(
                `/api/ratings?${entityType}Id=${entityId}`,
                {
                    method: "DELETE",
                }
            );
            if (!response.ok)
                throw new Error(`Failed to remove rating: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setRating(0);
            setHoverRating(0);
            if (onRatingChange) onRatingChange(0);
            if (isMobile) {
                setShowMobileRatingModal(false);
                setTempRating(0);
            }
        } catch (err) {
            console.error("Rating removal error:", err);
            setError(
                err instanceof Error ? err.message : "Failed to remove rating"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleStarClick = (star: number) => {
        if (isLoading) return;
        setTempRating(star);
    };

    const renderStar = (star: number, size = "text-xl") => {
        const currentRating =
            isMobile && showMobileRatingModal
                ? tempRating || rating
                : hoverRating || rating;

        if (currentRating >= star) {
            return <FaStar className={`text-yellow-400 ${size}`} />;
        } else if (currentRating >= star - 0.5) {
            return <FaStarHalfAlt className={`text-yellow-400 ${size}`} />;
        } else {
            return <FaRegStar className={`text-gray-400 ${size}`} />;
        }
    };

    const MobileRatingModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                ref={modalRef}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">
                        Rate this {entityType}
                    </h3>
                    <button
                        onClick={() => {
                            setShowMobileRatingModal(false);
                            setTempRating(0);
                        }}
                        className="text-gray-400 hover:text-white"
                    >
                        <FaTimes/>
                    </button>
                </div>

                <div className="flex items-center justify-center relative gap-1 py-4">
                    {rating > 0 && (
                        <button
                            onClick={handleRemoveRating}
                            className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-200 hover:text-red-700 mr-6"
                            aria-label="Remove rating"
                        >
                            <FaTimes size={15} />
                        </button>
                    )}

                    {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="relative">
                            <button
                                onClick={() => handleStarClick(star - 0.5)}
                                className="absolute left-0 top-0 w-1/2 h-full focus:outline-none"
                                aria-label={`Rate ${star - 0.5} out of 5`}
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleStarClick(star)}
                                className="absolute right-0 top-0 w-1/2 h-full focus:outline-none"
                                aria-label={`Rate ${star} out of 5`}
                                disabled={isLoading}
                            />
                            <div className="pointer-events-none text-5xl">
                                {renderStar(star, "text-5xl")}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between mt-4">
                    <button
                        onClick={() => {
                            setShowMobileRatingModal(false);
                            setTempRating(0);
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleRating(tempRating)}
                        disabled={!tempRating || isLoading}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                            tempRating
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }`}
                    >
                        <FaCheck />
                        Confirm Rating
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-1">
            {!isMobile && (
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <div key={star} className="relative w-6 h-6">
                                <button
                                    className="absolute left-0 top-0 w-1/2 h-full z-10"
                                    onClick={() => handleRating(star - 0.5)}
                                    onMouseEnter={() =>
                                        setHoverRating(star - 0.5)
                                    }
                                    onMouseLeave={() => setHoverRating(0)}
                                    disabled={isLoading}
                                    aria-label={`Rate ${star - 0.5} out of 5`}
                                />
                                <button
                                    className="absolute right-0 top-0 w-1/2 h-full z-10"
                                    onClick={() => handleRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    disabled={isLoading}
                                    aria-label={`Rate ${star} out of 5`}
                                />
                                <div className="pointer-events-none">
                                    {renderStar(star)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {rating > 0 && (
                        <button
                            onClick={handleRemoveRating}
                            disabled={isLoading}
                            className={`text-gray-200 hover:text-red-700 transition-colors ${
                                isLoading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            aria-label="Remove rating"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            )}

            {isMobile && (
                <div className="flex items-center gap-2">
                    {rating > 0 ? (
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <div key={star}>
                                    {renderStar(star, "text-xl")}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowMobileRatingModal(true)}
                            className="flex items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors"
                        >
                            <FaPlus />
                            <span>Rate</span>
                        </button>
                    )}

                    {rating > 0 && (
                        <button
                            onClick={() => setShowMobileRatingModal(true)}
                            className="text-sm text-gray-400 hover:text-white ml-2"
                        >
                            Edit
                        </button>
                    )}
                </div>
            )}

            {isMobile && showMobileRatingModal && <MobileRatingModal />}

            {isLoading && (
                <div className="flex items-center justify-center">
                    <svg
                        className="animate-spin h-2 w-2 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                    </svg>
                </div>
            )}
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
