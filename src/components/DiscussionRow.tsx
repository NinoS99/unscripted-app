"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { GiRose } from "react-icons/gi";
import { FiBarChart2, FiMessageCircle } from "react-icons/fi";

interface Discussion {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    spoiler: boolean;
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

interface DiscussionRowProps {
    discussion: Discussion;
    entityType: "show" | "season" | "episode";
    showSpoilers: { [key: number]: boolean };
    onToggleSpoiler: (discussionId: number) => void;
    truncateContent: (content: string, maxLength?: number) => string;
    className?: string;
    isLast?: boolean;
}

export default function DiscussionRow({
    discussion,
    entityType,
    showSpoilers,
    onToggleSpoiler,
    truncateContent,
    className = "",
    isLast = false
}: DiscussionRowProps) {
    return (
        <div className={`py-4 ${!isLast ? 'border-b border-gray-700' : ''} ${className}`}>
            <div className="flex items-start gap-3 mb-3">
                {/* User Profile Pic */}
                <div className="flex-shrink-0">
                    <Image
                        src={discussion.user.profilePicture || "/noAvatar.png"}
                        alt={discussion.user.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                            // Fallback to noAvatar if image fails
                            const target = e.target as HTMLImageElement;
                            target.src = "/noAvatar.png";
                        }}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-grow min-w-0">
                    {/* Top Row: Username and Date/Poll */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-2 mb-1 md:mb-0">
                            <span className="text-gray-300">
                                Discussion created by{" "}
                                <Link
                                    href={`/${discussion.user.username}/discussion/${entityType}/${discussion.id}`}
                                    className="font-semibold text-white hover:text-green-400 transition-colors"
                                >
                                    {discussion.user.username}
                                </Link>
                            </span>
                            <span className="text-gray-400 text-sm">
                                {format(new Date(discussion.createdAt), "MMM d, yyyy")}
                            </span>
                        </div>
                    </div>

                    {/* Discussion Title */}
                    <h3 className="text-lg font-semibold text-white mb-2">
                        <Link
                            href={`/discussions/${entityType}/${discussion.id}`}
                            className="hover:text-green-400 transition-colors"
                        >
                            {discussion.title}
                        </Link>
                    </h3>

                    {/* Discussion Content */}
                    <div className="mb-3">
                        {discussion.spoiler ? (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-400 text-sm font-medium">
                                        ⚠️ SPOILER
                                    </span>
                                    <button
                                        onClick={() => onToggleSpoiler(discussion.id)}
                                        className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                                    >
                                        {showSpoilers[discussion.id]
                                            ? "Hide Spoiler"
                                            : "Show Spoiler"}
                                    </button>
                                </div>
                                <p
                                    className={`text-gray-200 leading-relaxed transition-all duration-300 ${
                                        showSpoilers[discussion.id]
                                            ? "blur-none"
                                            : "blur-sm select-none"
                                    }`}
                                >
                                    {truncateContent(discussion.content, 300)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-200 leading-relaxed">
                                {truncateContent(discussion.content, 500)}
                            </p>
                        )}
                    </div>

                    {/* Poll Info (if exists) */}
                    {discussion.polls.length > 0 && (
                        <div className="mb-3">
                            <div className="flex items-center gap-2">
                                <FiBarChart2 className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400 font-medium">Poll:</span>
                                <span className="text-gray-200">{discussion.polls[0].question}</span>
                            </div>
                        </div>
                    )}

                    {/* Bottom Row: Likes and Comments */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                            <GiRose className="w-4 h-4" />
                            <span>{discussion._count.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FiMessageCircle className="w-4 h-4" />
                            <span>{discussion._count.comments}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
