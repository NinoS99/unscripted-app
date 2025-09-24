"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { FiTag, FiMessageCircle, FiStar, FiTrash2 } from "react-icons/fi";
import { GiRose } from "react-icons/gi";
import { useUser } from "@clerk/nextjs";
import LikeButton from "./LikeButton";
import DiscussionCommentsList from "./DiscussionCommentsList";
import DeleteEntityModal from "./DeleteEntityModal";

interface DiscussionDisplayProps {
    discussion: {
        id: number;
        title: string;
        content: string;
        spoiler: boolean;
        createdAt: Date;
        userRating?: number;
        userFavorite?: boolean;
        user: {
            id: string;
            username: string;
            profilePicture?: string | null;
        };
        tags: Array<{
            tag: {
                id: number;
                name: string;
            };
        }>;
        polls?: Array<{
            id: number;
            question: string;
            options: Array<{
                id: number;
                text: string;
                _count: {
                    votes: number;
                };
                votes?: Array<{
                    id: number;
                    userId: string;
                }>;
            }>;
        }>;
        likes: Array<{ id: number }>;
        comments?: Array<{
            id: number;
            content: string;
            createdAt: Date;
            user: {
                id: string;
                username: string;
                profilePicture?: string | null;
            };
        }>;
        _count: {
            likes: number;
            comments: number;
        };
    };
    discussionType: "show" | "season" | "episode";
    entity: {
        id: number;
        name?: string;
        posterPath?: string | null;
        stillPath?: string | null;
        firstAirDate?: Date | null;
        airDate?: Date | null;
        episodeNumber?: number;
        seasonNumber?: number;
        show?: {
            id: number;
            name: string;
            posterPath?: string | null;
        };
        season?: {
            id: number;
            seasonNumber: number;
            show: {
                id: number;
                name: string;
                posterPath?: string | null;
            };
        };
    };
    // Available image paths for fallback
    availableImages?: {
        episodeStillPath?: string | null;
        seasonPosterPath?: string | null;
        showPosterPath?: string | null;
    };
}

export default function DiscussionDisplay({
    discussion,
    discussionType,
    entity,
    availableImages = {},
}: DiscussionDisplayProps) {
    const { user } = useUser();
    const pathname = usePathname();
    const router = useRouter();
    const [likeCount, setLikeCount] = useState(discussion._count.likes || 0);
    const [pollVotes, setPollVotes] = useState<{ [key: number]: number }>({});
    const [userVote, setUserVote] = useState<number | null>(null);
    const [creatorVote, setCreatorVote] = useState<number | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const getEntityName = () => {
        switch (discussionType) {
            case "show":
                return entity?.name || "Unknown Show";
            case "season":
                return `${entity?.show?.name || "Unknown Show"} - ${
                    entity?.seasonNumber === 0
                        ? "Specials"
                        : `Season ${entity?.seasonNumber}`
                }`;
            case "episode":
                return `${entity?.season?.show?.name || "Unknown Show"} - ${
                    entity?.season?.seasonNumber === 0
                        ? "S"
                        : `S${entity?.season?.seasonNumber}E`
                }${entity?.episodeNumber} - ${
                    entity?.name || "Unknown Episode"
                }`;
        }
    };

    const getAirDate = () => {
        switch (discussionType) {
            case "show":
                return entity?.firstAirDate;
            case "season":
                return entity?.airDate;
            case "episode":
                return entity?.airDate;
        }
    };

    const getPosterPath = () => {
        switch (discussionType) {
            case "show":
                return entity?.posterPath;
            case "season":
                // Priority order: season poster → show poster
                return entity?.posterPath || availableImages?.showPosterPath;
            case "episode":
                // Priority order: episode still → season poster → show poster
                return (
                    availableImages?.episodeStillPath ||
                    availableImages?.seasonPosterPath ||
                    availableImages?.showPosterPath
                );
        }
    };

    const getDesktopPosterPath = () => {
        switch (discussionType) {
            case "show":
                return entity?.posterPath;
            case "season":
                return (
                    availableImages?.seasonPosterPath ||
                    availableImages?.showPosterPath
                );
            case "episode":
                // For desktop, prefer season poster → show poster (skip episode still)
                return (
                    availableImages?.seasonPosterPath ||
                    availableImages?.showPosterPath
                );
        }
    };

    const getEntityLink = () => {
        switch (discussionType) {
            case "show":
                return `/show/${entity?.id}`;
            case "season":
                return `/show/${entity?.show?.id || 0}/season/${
                    entity?.seasonNumber
                }`;
            case "episode":
                return `/show/${entity?.season?.show?.id || 0}/season/${
                    entity?.season?.seasonNumber || 0
                }/episode/${entity?.episodeNumber || 0}`;
        }
    };

    // Initialize poll votes from discussion data
    useEffect(() => {
        if (discussion.polls && discussion.polls.length > 0) {
            const poll = discussion.polls[0];
            const votes: { [key: number]: number } = {};
            poll.options.forEach((option) => {
                votes[option.id] = option._count.votes;
            });
            setPollVotes(votes);
        }
    }, [discussion.polls]);

    // Fetch user's vote and creator's vote from database
    useEffect(() => {
        const fetchVotes = async () => {
            if (!user?.id || !discussion.polls || discussion.polls.length === 0)
                return;

            try {
                const response = await fetch(
                    `/api/polls/user-vote?pollId=${discussion.polls[0].id}&creatorId=${discussion.user.id}`
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.optionId) {
                        setUserVote(data.optionId);
                    } else {
                        setUserVote(null);
                    }

                    if (data.creatorOptionId) {
                        setCreatorVote(data.creatorOptionId);
                    } else {
                        setCreatorVote(null);
                    }
                }
            } catch (error) {
                console.error("Error fetching votes:", error);
            }
        };

        fetchVotes();
    }, [user?.id, discussion.polls, discussion.user.id]);

    const handleVote = async (optionId: number) => {
        if (!user || isVoting) return;

        setIsVoting(true);
        try {
            const response = await fetch("/api/polls/vote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    optionId,
                    pollId: discussion.polls?.[0]?.id,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setPollVotes(data.updatedVotes);
                setUserVote(optionId);

                // If the current user is the creator, also update creatorVote
                if (user.id === discussion.user.id) {
                    setCreatorVote(optionId);
                }

                console.log(
                    "Vote updated:",
                    optionId,
                    "User vote set to:",
                    optionId
                );
            }
        } catch (error) {
            console.error("Error voting:", error);
        } finally {
            setIsVoting(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!user) return;

        setIsDeleting(true);
        try {
            const response = await fetch(
                `/api/discussions/delete/${discussion.id}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                // Navigate back to the entity page
                const entityLink = getEntityLink();
                router.push(entityLink);
            } else {
                const error = await response.json();
                console.error("Failed to delete discussion:", error);
                setIsDeleting(false);
            }
        } catch (error) {
            console.error("Error deleting discussion:", error);
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-0 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Mobile Layout */}
                        <div className="md:hidden mb-8 -mx-4">
                            {/* Full-width poster with overlay */}
                            <div
                                className="relative w-screen"
                                style={{
                                    height: "auto",
                                    aspectRatio:
                                        discussionType === "episode" &&
                                        availableImages?.episodeStillPath
                                            ? "16/9"
                                            : "2/3",
                                }}
                            >
                                <Link href={getEntityLink()}>
                                    <Image
                                        src={
                                            getPosterPath()
                                                ? `https://image.tmdb.org/t/p/w780${getPosterPath()}`
                                                : "/noPoster.jpg"
                                        }
                                        alt={getEntityName()}
                                        width={780}
                                        height={
                                            discussionType === "episode" &&
                                            availableImages?.episodeStillPath
                                                ? 439
                                                : 1170
                                        }
                                        className="w-full h-full object-cover absolute inset-0"
                                        priority
                                        quality={90}
                                    />
                                </Link>

                                {/* Overlay with entity info */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-10">
                                    <h1 className="text-xl font-bold text-white mb-1">
                                        <Link
                                            href={getEntityLink()}
                                            className="hover:text-green-400 transition-colors"
                                        >
                                            {getEntityName()}
                                        </Link>
                                    </h1>
                                    {getAirDate() && (
                                        <p className="text-sm text-gray-200">
                                            Aired on{" "}
                                            {format(
                                                getAirDate()!,
                                                "MMMM d, yyyy"
                                            )}
                                        </p>
                                    )}
                                    {/* Discussion by */}
                                    <div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Image
                                                src={
                                                    discussion.user
                                                        .profilePicture ||
                                                    "/noAvatar.png"
                                                }
                                                alt={discussion.user.username}
                                                width={24}
                                                height={24}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                            <p className="text-gray-400 text-sm">
                                                Discussion by{" "}
                                                <Link
                                                    href={`/${discussion.user.username}`}
                                                    className="font-semibold text-white hover:text-green-400 transition-colors"
                                                >
                                                    {discussion.user.username}
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile info below poster */}
                            <div className="mt-4 space-y-4 px-4">
                                {/* Discussion Title */}
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">
                                        {discussion.title}
                                    </h2>
                                </div>

                                {/* User's Rating and Favorite Status */}
                                <div className="space-y-2">
                                    {/* First row: Rating and Rose (if both exist) */}
                                    {(discussion.userRating ||
                                        discussion.userFavorite) && (
                                        <div className="flex items-center gap-4">
                                            {discussion.userRating && (
                                                <div className="flex items-center gap-1">
                                                    <FiStar className="w-5 h-5 text-yellow-400 fill-current" />
                                                    <span className="text-lg font-semibold text-yellow-400">
                                                        {discussion.userRating}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        / 5
                                                    </span>
                                                </div>
                                            )}
                                            {discussion.userFavorite && (
                                                <div className="flex items-center gap-1">
                                                    <GiRose className="w-5 h-5 text-red-400 fill-current" />
                                                    <span className="text-sm text-red-400 font-medium pl-1">
                                                        Discussion creator gave
                                                        this {discussionType} a
                                                        rose
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Second row: Spoiler (if exists) */}
                                    {discussion.spoiler && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-red-400 text-sm font-medium">
                                                ⚠️ SPOILER
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <GiRose className="w-4 h-4 text-red-400 fill-current" />
                                        <span>{likeCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiMessageCircle className="w-4 h-4" />
                                        <span>
                                            {discussion._count.comments || 0}
                                        </span>
                                    </div>
                                    {user && user.id === discussion.user.id && (
                                        <button
                                            onClick={handleDeleteClick}
                                            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                                            title="Delete discussion"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            <span>Delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex flex-row gap-6 mb-8">
                            {/* Poster */}
                            <div className="flex-shrink-0">
                                <Link href={getEntityLink()}>
                                    <Image
                                        src={
                                            getDesktopPosterPath()
                                                ? `https://image.tmdb.org/t/p/w500${getDesktopPosterPath()}`
                                                : "/noPoster.jpg"
                                        }
                                        alt={getEntityName()}
                                        width={200}
                                        height={300}
                                        className="rounded-lg object-cover hover:opacity-80 transition-opacity"
                                    />
                                </Link>
                            </div>

                            {/* Entity Info */}
                            <div className="flex-grow">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image
                                            src={
                                                discussion.user
                                                    .profilePicture ||
                                                "/noAvatar.png"
                                            }
                                            alt={discussion.user.username}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <p className="text-gray-400 text-sm">
                                            Discussion by{" "}
                                            <Link
                                                href={`/${discussion.user.username}`}
                                                className="font-semibold text-white hover:text-green-400 transition-colors"
                                            >
                                                {discussion.user.username}
                                            </Link>
                                        </p>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                        <Link
                                            href={getEntityLink()}
                                            className="hover:text-green-400 transition-colors"
                                        >
                                            {getEntityName()}
                                        </Link>
                                    </h1>
                                    {getAirDate() && (
                                        <p className="text-gray-400">
                                            Aired on{" "}
                                            {format(
                                                getAirDate()!,
                                                "MMMM d, yyyy"
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Discussion Title */}
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-white">
                                        {discussion.title}
                                    </h2>
                                </div>

                                {/* User's Rating and Favorite Status */}
                                <div className="mb-4 flex items-center gap-4">
                                    {discussion.userRating && (
                                        <div className="flex items-center gap-1">
                                            <FiStar className="w-5 h-5 text-yellow-400 fill-current" />
                                            <span className="text-lg font-semibold text-yellow-400">
                                                {discussion.userRating}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                / 5
                                            </span>
                                        </div>
                                    )}
                                    {discussion.userFavorite && (
                                        <div className="flex items-center gap-1">
                                            <GiRose className="w-5 h-5 text-red-400 fill-current" />
                                            <span className="text-sm text-red-400 font-medium pl-1">
                                                Discussion creator gave this{" "}
                                                {discussionType} a rose
                                            </span>
                                        </div>
                                    )}
                                    {discussion.spoiler && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-red-400 text-sm font-medium">
                                                ⚠️ SPOILER
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <GiRose className="w-4 h-4 text-red-400 fill-current" />
                                        <span>{likeCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiMessageCircle className="w-4 h-4" />
                                        <span>
                                            {discussion._count.comments || 0}
                                        </span>
                                    </div>
                                    {user && user.id === discussion.user.id && (
                                        <button
                                            onClick={handleDeleteClick}
                                            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                                            title="Delete discussion"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            <span>Delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Discussion Content */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-green-500 mb-4">
                                Discussion
                            </h2>
                            <div className="border-b border-gray-600 mb-4"></div>
                            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {discussion.content}
                            </p>
                        </div>

                        {/* Like Button */}
                        <div className="mb-6">
                            <LikeButton
                                entityType="discussion"
                                entityId={discussion.id}
                                initialIsLiked={discussion.likes?.length > 0}
                                size="lg"
                                onLikeChange={(isLiked) => {
                                    setLikeCount((prev) =>
                                        isLiked ? prev + 1 : prev - 1
                                    );
                                }}
                            />
                        </div>

                        {/* Tags */}
                        {discussion.tags && discussion.tags.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-green-500 mb-4 flex items-center gap-2">
                                    <FiTag className="text-green-400" />
                                    Tags
                                </h3>
                                <div className="border-b border-gray-600 mb-4"></div>
                                <div className="flex flex-wrap gap-2">
                                    {discussion.tags.map((tagRelation) => (
                                        <span
                                            key={tagRelation.tag.id}
                                            className="px-3 py-1 bg-green-600 text-white rounded-full text-sm"
                                        >
                                            {tagRelation.tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Poll */}
                        {discussion.polls && discussion.polls.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-green-500 mb-4 flex items-center gap-2">
                                    <FiMessageCircle className="text-green-400" />
                                    Poll
                                </h3>
                                <div className="border-b border-gray-600 mb-4"></div>
                                <div className="bg-gray-800 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold mb-4">
                                        {discussion.polls[0].question}
                                    </h4>
                                    {creatorVote && (
                                        <div className="mb-4 p-2 bg-green-600/20 border border-green-600/30 rounded text-green-400 text-sm">
                                            {discussion.user.username}{" "}
                                            (discussion creator) voted for:{" "}
                                            {
                                                discussion.polls[0].options.find(
                                                    (opt) =>
                                                        opt.id === creatorVote
                                                )?.text
                                            }
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        {discussion.polls[0].options
                                            .sort((a, b) => a.id - b.id)
                                            .map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() =>
                                                        handleVote(option.id)
                                                    }
                                                    disabled={isVoting}
                                                    className={`w-full flex items-center justify-between p-3 rounded transition-colors ${
                                                        userVote === option.id
                                                            ? "bg-green-600 text-white"
                                                            : "bg-gray-700 hover:bg-gray-600 text-white"
                                                    } ${
                                                        isVoting
                                                            ? "cursor-not-allowed opacity-60"
                                                            : "cursor-pointer"
                                                    }`}
                                                >
                                                    <div className="flex-1 text-left">
                                                        <span>
                                                            {option.text}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm ml-4">
                                                        {pollVotes[option.id] ||
                                                            0}{" "}
                                                        votes
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                    {!user && (
                                        <div className="mt-4 text-center text-gray-400 text-sm">
                                            <Link
                                                href={`/sign-in?redirect_url=${encodeURIComponent(
                                                    pathname
                                                )}`}
                                                className="text-green-400 hover:text-green-300"
                                            >
                                                Sign in
                                            </Link>{" "}
                                            to vote in this poll
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <DiscussionCommentsList discussionId={discussion.id} />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteEntityModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
                entityType="discussion"
            />
        </div>
    );
}
