"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FiSmile, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";

interface ReactionType {
    id: number;
    name: string;
    description?: string;
    emoji?: string | null;
    category?: string | null;
}

interface Reaction {
    id: number;
    userId: string;
    reactionType: ReactionType;
}

interface CommentReactionsProps {
    commentId: number;
    reactions: Reaction[];
    onReactionChange: () => void;
    showOnlyDisplay?: boolean;
    showOnlyButton?: boolean;
    hideButtonText?: boolean;
}

// New ReactionPickerModal component
interface ReactionPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    reactionTypes: Record<string, ReactionType[]>;
    userReaction: Reaction | undefined;
    onReaction: (reactionTypeId: number) => void;
    onRemoveReaction: () => void;
    isLoading: boolean;
}

function ReactionPickerModal({
    isOpen,
    onClose,
    reactionTypes,
    userReaction,
    onReaction,
    onRemoveReaction,
    isLoading,
}: ReactionPickerModalProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h3 className="text-lg font-medium text-white">
                        Choose a reaction
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                    {Object.entries(reactionTypes).map(([category, types]) => (
                        <div key={category} className="mb-4">
                            <button
                                onClick={() => toggleCategory(category)}
                                className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 hover:text-white mb-2"
                            >
                                <span className="capitalize">{category}</span>
                                {expandedCategories.has(category) ? (
                                    <FiChevronUp className="w-4 h-4" />
                                ) : (
                                    <FiChevronDown className="w-4 h-4" />
                                )}
                            </button>

                            {expandedCategories.has(category) && (
                                <div className="grid grid-cols-2 gap-2">
                                    {types.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                onReaction(type.id);
                                                onClose();
                                            }}
                                            disabled={isLoading}
                                            className={`flex items-center gap-2 p-3 text-sm rounded transition-colors ${
                                                userReaction?.reactionType.id === type.id
                                                    ? "bg-green-600 text-white"
                                                    : "text-gray-300 hover:bg-gray-700"
                                            }`}
                                        >
                                            {type.emoji && (
                                                <span className="text-lg">{type.emoji}</span>
                                            )}
                                            <span>{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Remove reaction option */}
                    {userReaction && (
                        <button
                            onClick={() => {
                                onRemoveReaction();
                                onClose();
                            }}
                            disabled={isLoading}
                            className="w-full p-3 text-sm text-red-400 hover:bg-red-900/20 rounded transition-colors border border-red-400/20"
                        >
                            Remove reaction
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CommentReactions({
    commentId,
    reactions,
    onReactionChange,
    showOnlyDisplay = false,
    showOnlyButton = false,
    hideButtonText = false,
}: CommentReactionsProps) {
    const { user } = useUser();
    const [reactionTypes, setReactionTypes] = useState<
        Record<string, ReactionType[]>
    >({});
    const [isLoading, setIsLoading] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    // Group reactions by type
    const reactionCounts = reactions.reduce((acc, reaction) => {
        const typeId = reaction.reactionType.id;
        if (!acc[typeId]) {
            acc[typeId] = {
                count: 0,
                reactionType: reaction.reactionType,
            };
        }
        acc[typeId].count++;
        return acc;
    }, {} as Record<number, { count: number; reactionType: ReactionType }>);

    // Sort reactions by count in descending order
    const sortedReactions = Object.values(reactionCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Take top 5

    // Check if current user has a reaction
    const userReaction = reactions.find((r) => r.userId === user?.id);

    useEffect(() => {
        fetchReactionTypes();
    }, []);

    const fetchReactionTypes = async () => {
        try {
            const response = await fetch("/api/reaction-types");
            if (response.ok) {
                const data = await response.json();
                setReactionTypes(data.reactionTypes);
            }
        } catch (error) {
            console.error("Error fetching reaction types:", error);
        }
    };

    const handleReaction = async (reactionTypeId: number) => {
        if (!user) return;

        // Optimistic update
        const previousReactions = [...reactions];
        const reactionType = Object.values(reactionTypes)
            .flat()
            .find((rt) => rt.id === reactionTypeId);

        // Remove existing reaction and add new one
        const updatedReactions = reactions.filter((r) => r.userId !== user.id);
        if (reactionType) {
            updatedReactions.push({
                id: Date.now(), // Temporary ID
                userId: user.id,
                reactionType,
            });
        }

        // Update the reactions array directly
        reactions.splice(0, reactions.length, ...updatedReactions);

        // Force re-render
        onReactionChange();

        setIsLoading(true);
        try {
            const response = await fetch("/api/discussions/comments/reaction", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    commentId,
                    reactionTypeId,
                }),
            });

            if (!response.ok) {
                // Revert on error
                reactions.splice(0, reactions.length, ...previousReactions);
                onReactionChange();
            }
        } catch (error) {
            console.error("Error adding reaction:", error);
            // Revert on error
            reactions.splice(0, reactions.length, ...previousReactions);
            onReactionChange();
        } finally {
            setIsLoading(false);
        }
    };

    const removeReaction = async () => {
        if (!user) return;

        // Optimistic update
        const previousReactions = [...reactions];
        const updatedReactions = reactions.filter((r) => r.userId !== user.id);

        // Update the reactions array directly
        reactions.splice(0, reactions.length, ...updatedReactions);

        // Force re-render
        onReactionChange();

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/discussions/comments/reaction?commentId=${commentId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                // Revert on error
                reactions.splice(0, reactions.length, ...previousReactions);
                onReactionChange();
            }
        } catch (error) {
            console.error("Error removing reaction:", error);
            // Revert on error
            reactions.splice(0, reactions.length, ...previousReactions);
            onReactionChange();
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    // Show only the display of existing reactions
    if (showOnlyDisplay) {
        if (sortedReactions.length === 0) return null;

        return (
            <div className="flex items-center gap-1">
                {sortedReactions
                    .map(({ count, reactionType }) => (
                        <button
                            key={reactionType.id}
                            onClick={() => handleReaction(reactionType.id)}
                            disabled={isLoading}
                            className={`text-xs transition-colors ${
                                userReaction?.reactionType.id ===
                                reactionType.id
                                    ? "text-green-500"
                                    : "text-gray-400 hover:text-white"
                            }`}
                            title={`${reactionType.name} (${count})`}
                        >
                            {reactionType.emoji && (
                                <span>{reactionType.emoji}</span>
                            )}
                            <span className="ml-1">({count})</span>
                        </button>
                    ))
                    .reduce((acc, element, index) => {
                        if (index > 0) {
                            acc.push(
                                <span
                                    key={`separator-${index}`}
                                    className="text-gray-600"
                                >
                                    •
                                </span>
                            );
                        }
                        acc.push(element);
                        return acc;
                    }, [] as React.ReactNode[])}
            </div>
        );
    }

    // Show only the add/change reaction button
    if (showOnlyButton) {
        return (
            <>
                <button
                    onClick={() => setShowReactionPicker(true)}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
                    title={userReaction ? "Change reaction" : "Add reaction"}
                >
                    <FiSmile className="w-3 h-3" />
                    {hideButtonText
                        ? null
                        : userReaction
                        ? "Change reaction"
                        : "Add reaction"}
                </button>

                <ReactionPickerModal
                    isOpen={showReactionPicker}
                    onClose={() => setShowReactionPicker(false)}
                    reactionTypes={reactionTypes}
                    userReaction={userReaction}
                    onReaction={handleReaction}
                    onRemoveReaction={removeReaction}
                    isLoading={isLoading}
                />
            </>
        );
    }

    // Default behavior (show both display and button)
    return (
        <div className="relative">
            {/* Display existing reactions */}
            {sortedReactions.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                    {sortedReactions
                        .map(({ count, reactionType }) => (
                            <button
                                key={reactionType.id}
                                onClick={() => handleReaction(reactionType.id)}
                                disabled={isLoading}
                                className={`text-xs transition-colors ${
                                    userReaction?.reactionType.id ===
                                    reactionType.id
                                        ? "text-green-500"
                                        : "text-gray-400 hover:text-white"
                                }`}
                                title={`${reactionType.name} (${count})`}
                            >
                                {reactionType.emoji && (
                                    <span>{reactionType.emoji}</span>
                                )}
                                <span className="ml-1">({count})</span>
                            </button>
                        ))
                        .reduce((acc, element, index) => {
                            if (index > 0) {
                                acc.push(
                                    <span
                                        key={`separator-${index}`}
                                        className="text-gray-600"
                                    >
                                        •
                                    </span>
                                );
                            }
                            acc.push(element);
                            return acc;
                        }, [] as React.ReactNode[])}
                </div>
            )}

            {/* Add reaction button */}
            <button
                onClick={() => setShowReactionPicker(true)}
                disabled={isLoading}
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
                title={userReaction ? "Change reaction" : "Add reaction"}
            >
                <FiSmile className="w-3 h-3" />
                {userReaction ? "Change reaction" : "Add reaction"}
            </button>

            <ReactionPickerModal
                isOpen={showReactionPicker}
                onClose={() => setShowReactionPicker(false)}
                reactionTypes={reactionTypes}
                userReaction={userReaction}
                onReaction={handleReaction}
                onRemoveReaction={removeReaction}
                isLoading={isLoading}
            />
        </div>
    );
}
