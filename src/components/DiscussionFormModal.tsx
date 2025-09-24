"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { FiX, FiPlus, FiTrash2, FiStar } from "react-icons/fi";
import { GiRose } from "react-icons/gi";
import { useModalScrollPrevention } from "@/hooks/useModalScrollPrevention";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface DiscussionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: "show" | "season" | "episode";
    entityId: number;
    entityName: string;
    entityData?: {
        rating?: number;
        isFavorited?: boolean;
    };
}

interface PollOption {
    id: string;
    text: string;
}

export default function DiscussionFormModal({ 
    isOpen, 
    onClose, 
    entityType, 
    entityId, 
    entityName, 
    entityData 
}: DiscussionFormModalProps) {
    const { user } = useUser();
    const router = useRouter();
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [spoiler, setSpoiler] = useState(false);
    const [includePoll, setIncludePoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState<PollOption[]>([
        { id: "1", text: "" },
        { id: "2", text: "" }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Prevent background scrolling when modal is open
    useModalScrollPrevention(isOpen);
    
    // Handle escape key to close modal
    useEscapeKey(isOpen, onClose);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setContent("");
            setTags([]);
            setNewTag("");
            setSpoiler(false);
            setIncludePoll(false);
            setPollQuestion("");
            setPollOptions([
                { id: "1", text: "" },
                { id: "2", text: "" }
            ]);
            setErrorMessage(null);
        }
    }, [isOpen]);

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const addPollOption = () => {
        if (pollOptions.length < 10) {
            const newId = (pollOptions.length + 1).toString();
            setPollOptions([...pollOptions, { id: newId, text: "" }]);
        }
    };

    const removePollOption = (id: string) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter(option => option.id !== id));
        }
    };

    const updatePollOption = (id: string, text: string) => {
        setPollOptions(pollOptions.map(option => 
            option.id === id ? { ...option, text } : option
        ));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            setErrorMessage("Title and content are required");
            return;
        }

        if (includePoll && (!pollQuestion.trim() || pollOptions.some(opt => !opt.text.trim()))) {
            setErrorMessage("Poll question and all options are required");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const discussionData = {
                title: title.trim(),
                content: content.trim(),
                tags,
                spoiler,
                entityType,
                entityId,
                ...(includePoll && {
                    poll: {
                        question: pollQuestion.trim(),
                        options: pollOptions.map(opt => opt.text.trim())
                    }
                })
            };

            const response = await fetch("/api/discussions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(discussionData),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/${user?.username}/discussion/${entityType}/${data.discussion.id}`);
                onClose();
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.error || "Failed to create discussion");
            }
        } catch (error) {
            console.error("Error creating discussion:", error);
            setErrorMessage("Failed to create discussion");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getEntityTypeLabel = () => {
        switch (entityType) {
            case "show": return "Show";
            case "season": return "Season";
            case "episode": return "Episode";
            default: return "Entity";
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm md:bg-white/5 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-white">
                        Spill the Tea About This {getEntityTypeLabel()}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="modal-content p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-600 text-white rounded-md text-sm">
                            {errorMessage}
                        </div>
                    )}

                    {/* Entity Info */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">
                        {entityName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                            {entityData?.rating && (
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <FiStar className="w-4 h-4" />
                                    <span>{entityData.rating}/5</span>
                                </div>
                            )}
                            {entityData?.isFavorited && (
                                <div className="flex items-center gap-1 text-red-400">
                                    <GiRose className="w-4 h-4" />
                                    <span>You have given this {getEntityTypeLabel().toLowerCase()} a rose</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title Input */}
                    <div className="mb-4">
                        <label className="block text-white font-medium mb-2">
                            Discussion Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter discussion title..."
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-blue-400"
                        />
                    </div>

                    {/* Content Input */}
                    <div className="mb-4">
                        <label className="block text-white font-medium mb-2">
                            Content *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your thoughts, questions, or theories..."
                            rows={6}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-blue-400 resize-none"
                        />
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
                        <label className="block text-white font-medium mb-2">
                            Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                placeholder="Add a tag..."
                                className="flex-grow px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-green-400"
                            />
                            <button
                                onClick={addTag}
                                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded-md"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-red-300 transition-colors"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Spoiler Checkbox */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2 text-white">
                            <input
                                type="checkbox"
                                checked={spoiler}
                                onChange={(e) => setSpoiler(e.target.checked)}
                                className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500 focus:ring-2"
                                style={{ accentColor: "#16a34a" }}
                            />
                            <span>Contains spoilers</span>
                        </label>
                    </div>

                    {/* Poll Section */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2 text-white mb-4">
                            <input
                                type="checkbox"
                                checked={includePoll}
                                onChange={(e) => setIncludePoll(e.target.checked)}
                                className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500 focus:ring-2"
                                style={{ accentColor: "#16a34a" }}
                            />
                            <span className="font-medium">Include a poll</span>
                        </label>

                        {includePoll && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Poll Question *
                                    </label>
                                    <input
                                        type="text"
                                        value={pollQuestion}
                                        onChange={(e) => setPollQuestion(e.target.value)}
                                        placeholder="What would you like to ask?"
                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Poll Options *
                                    </label>
                                    <div className="space-y-2">
                                        {pollOptions.map((option) => (
                                            <div key={option.id} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) => updatePollOption(option.id, e.target.value)}
                                                    placeholder={`Option ${option.id}`}
                                                    className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:border-blue-400"
                                                />
                                                {pollOptions.length > 2 && (
                                                    <button
                                                        onClick={() => removePollOption(option.id)}
                                                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {pollOptions.length < 10 && (
                                            <button
                                                onClick={addPollOption}
                                                className="flex items-center gap-2 px-3 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                <FiPlus className="w-4 h-4" />
                                                Add Option
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting || 
                                !title.trim() || 
                                !content.trim() ||
                                (includePoll && (!pollQuestion.trim() || pollOptions.filter(opt => opt.text.trim()).length < 2))
                            }
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Creating..." : "Create Discussion"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
