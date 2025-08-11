"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    FiMessageCircle,
    FiClock,
    FiTrendingUp,
    FiBarChart2,
} from "react-icons/fi";
import { GiRose } from "react-icons/gi";

interface Discussion {
    id: number;
    title: string;
    content: string;
    spoiler: boolean;
    createdAt: Date;
    user: {
        id: string;
        username: string;
        profilePicture: string | null;
    };
    _count: {
        likes: number;
        comments: number;
    };
    polls: {
        id: number;
        question: string;
    }[];
}

interface EntityDiscussionsProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
}

export default function EntityDiscussions({
    entityType,
    entityId,
}: EntityDiscussionsProps) {
    const [discussions, setDiscussions] = useState<{
        recent: Discussion[];
        popular: Discussion[];
    }>({ recent: [], popular: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDiscussions = async () => {
            try {
                const response = await fetch(
                    `/api/discussions?entityType=${entityType}&entityId=${entityId}&limit=6`
                );
                if (response.ok) {
                    const data = await response.json();
                    setDiscussions({
                        recent: data.recent || [],
                        popular: data.popular || [],
                    });
                }
            } catch (error) {
                console.error("Error fetching discussions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiscussions();
    }, [entityType, entityId]);

    if (isLoading) {
        return (
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-green-500 mb-4">
                    Discussions
                </h2>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const allDiscussions = [...discussions.recent, ...discussions.popular];

    if (allDiscussions.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 mt-3">
                <h2 className="text-xl md:text-lg font-semibold text-green-500">
                    Discussions
                </h2>
                <Link
                    href={`/discussions/${entityType}/${entityId}`}
                    className="text-sm text-green-400 hover:text-green-200 transition-colors"
                >
                    See all
                </Link>
            </div>
            <div className="md:hidden border-b border-gray-600 mb-4"></div>

            {/* Desktop Layout */}
            <div className="hidden md:block space-y-6">
                {/* Popular Discussions */}
                {discussions.popular.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FiTrendingUp className="w-4 h-4 text-green-400" />
                            <h3 className="text-sm font-medium text-gray-300">
                                Popular
                            </h3>
                        </div>
                        <div className="space-y-0">
                            {discussions.popular
                                .slice(0, 3)
                                .map((discussion, index) => (
                                    <div key={discussion.id}>
                                        <DiscussionCard
                                            discussion={discussion}
                                            entityType={entityType}
                                        />
                                        {index <
                                            discussions.popular.slice(0, 3)
                                                .length -
                                                1 && (
                                            <div className="border-t border-gray-700 my-3"></div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Recent Discussions */}
                {discussions.recent.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FiClock className="w-4 h-4 text-green-400" />
                            <h3 className="text-sm font-medium text-gray-300">
                                Recent
                            </h3>
                        </div>
                        <div className="space-y-0">
                            {discussions.recent
                                .slice(0, 3)
                                .map((discussion, index) => (
                                    <div key={discussion.id}>
                                        <DiscussionCard
                                            discussion={discussion}
                                            entityType={entityType}
                                        />
                                        {index <
                                            discussions.recent.slice(0, 3)
                                                .length -
                                                1 && (
                                            <div className="border-t border-gray-700 my-3"></div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-6">
                {/* Popular Discussions */}
                {discussions.popular.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FiTrendingUp className="w-4 h-4 text-green-400" />
                            <h3 className="text-sm font-medium text-gray-300">
                                Popular
                            </h3>
                        </div>
                        <div className="space-y-0">
                            {discussions.popular
                                .slice(0, 3)
                                .map((discussion, index) => (
                                    <div
                                        key={`mobile-popular-${discussion.id}-${index}`}
                                    >
                                        <DiscussionCard
                                            discussion={discussion}
                                            entityType={entityType}
                                        />
                                        {index <
                                            discussions.popular.slice(0, 3)
                                                .length -
                                                1 && (
                                            <div className="border-t border-gray-700 my-3"></div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Recent Discussions */}
                {discussions.recent.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FiClock className="w-4 h-4 text-green-400" />
                            <h3 className="text-sm font-medium text-gray-300">
                                Recent
                            </h3>
                        </div>
                        <div className="space-y-0">
                            {discussions.recent
                                .slice(0, 3)
                                .map((discussion, index) => (
                                    <div
                                        key={`mobile-recent-${discussion.id}-${index}`}
                                    >
                                        <DiscussionCard
                                            discussion={discussion}
                                            entityType={entityType}
                                        />
                                        {index <
                                            discussions.recent.slice(0, 3)
                                                .length -
                                                1 && (
                                            <div className="border-t border-gray-700 my-3"></div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DiscussionCard({
    discussion,
    entityType,
}: {
    discussion: Discussion;
    entityType: "show" | "season" | "episode";
}) {
    const truncatedContent =
        discussion.content.length > 100
            ? discussion.content.substring(0, 100) + "..."
            : discussion.content;

    return (
        <Link
            href={`/${discussion.user.username}/discussion/${entityType}/${discussion.id}`}
        >
            <div className="block  hover:bg-gray-800/50 rounded-lg transition-colors">
                <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-medium text-white hover:text-green-400 transition-colors line-clamp-2">
                                {discussion.title}
                            </h4>
                            {discussion.spoiler ? (
                                <p className="text-xs text-red-400 mt-1 font-medium">
                                    CONTAINS SPOILER
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                    {truncatedContent}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <p className="text-xs text-gray-400">
                                    by {discussion.user.username}
                                </p>
                                <span className="text-xs text-gray-500">•</span>
                                <p className="text-xs text-gray-400">
                                    {format(
                                        new Date(discussion.createdAt),
                                        "MMM d"
                                    )}
                                </p>
                            </div>
                            {discussion.polls &&
                                discussion.polls.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <FiBarChart2 className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs text-blue-400">
                                            Poll
                                        </span>
                                    </div>
                                )}
                        </div>
                        <div className="flex items-center gap-3 text-gray-400 ml-3">
                            <div className="flex items-center gap-1">
                                <FiMessageCircle className="w-3 h-3" />
                                <span className="text-xs">
                                    {discussion._count.comments}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <GiRose className="w-3 h-3 text-red-400" />
                                <span className="text-xs">
                                    {discussion._count.likes}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
