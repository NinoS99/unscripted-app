import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import DiscussionDisplay from "@/components/DiscussionDisplay";
import { notFound } from "next/navigation";

interface DiscussionPageProps {
    params: Promise<{
        username: string;
        discussionType: string;
        discussionId: string;
    }>;
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
    const { userId } = await auth();
    
    // Allow public access to view discussions, but userId will be null if not logged in

    const { username, discussionType, discussionId } = await params;

    // Validate discussion type
    if (!["show", "season", "episode"].includes(discussionType)) {
        notFound();
    }

    try {
        let discussion;
        let entity;

        switch (discussionType) {
            case "show":
                discussion = await prisma.discussion.findUnique({
                    where: { id: parseInt(discussionId) },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePicture: true,
                            },
                        },
                        show: {
                            select: {
                                id: true,
                                name: true,
                                posterPath: true,
                                firstAirDate: true,
                                overview: true,
                            },
                        },
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                        polls: {
                            include: {
                                options: {
                                    include: {
                                        _count: {
                                            select: {
                                                votes: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        ...(userId && {
                            likes: {
                                where: { userId },
                            },
                        }),
                        comments: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        profilePicture: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                    },
                });
                entity = discussion?.show;
                break;

            case "season":
                discussion = await prisma.discussion.findUnique({
                    where: { id: parseInt(discussionId) },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePicture: true,
                            },
                        },
                        season: {
                            select: {
                                id: true,
                                seasonNumber: true,
                                airDate: true,
                                posterPath: true,
                                overview: true,
                                show: {
                                    select: {
                                        id: true,
                                        name: true,
                                        posterPath: true,
                                    },
                                },
                            },
                        },
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                        polls: {
                            include: {
                                options: {
                                    include: {
                                        _count: {
                                            select: {
                                                votes: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        ...(userId && {
                            likes: {
                                where: { userId },
                            },
                        }),
                        comments: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        profilePicture: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                    },
                });
                entity = discussion?.season;
                break;

            case "episode":
                discussion = await prisma.discussion.findUnique({
                    where: { id: parseInt(discussionId) },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePicture: true,
                            },
                        },
                        episode: {
                            select: {
                                id: true,
                                episodeNumber: true,
                                name: true,
                                airDate: true,
                                stillPath: true,
                                overview: true,
                                season: {
                                    select: {
                                        id: true,
                                        seasonNumber: true,
                                        posterPath: true,
                                        show: {
                                            select: {
                                                id: true,
                                                name: true,
                                                posterPath: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                        polls: {
                            include: {
                                options: {
                                    include: {
                                        _count: {
                                            select: {
                                                votes: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        ...(userId && {
                            likes: {
                                where: { userId },
                            },
                        }),
                        comments: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        profilePicture: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                    },
                });
                entity = discussion?.episode;
                break;
        }

        if (!discussion || !entity) {
            notFound();
        }

        // Verify the username matches the discussion author
        if (discussion.user.username !== username) {
            notFound();
        }

        // Get the discussion author's rating and favorite status for this entity
        let userRating;
        let userFavorite;
        switch (discussionType) {
            case "show":
                userRating = await prisma.rating.findUnique({
                    where: {
                        userId_showId: {
                            userId: discussion.user.id,
                            showId: entity.id,
                        },
                    },
                });
                userFavorite = await prisma.favorite.findFirst({
                    where: {
                        userId: discussion.user.id,
                        showId: entity.id,
                    },
                });
                break;
            case "season":
                userRating = await prisma.rating.findUnique({
                    where: {
                        userId_seasonId: {
                            userId: discussion.user.id,
                            seasonId: entity.id,
                        },
                    },
                });
                userFavorite = await prisma.favorite.findFirst({
                    where: {
                        userId: discussion.user.id,
                        seasonId: entity.id,
                    },
                });
                break;
            case "episode":
                userRating = await prisma.rating.findUnique({
                    where: {
                        userId_episodeId: {
                            userId: discussion.user.id,
                            episodeId: entity.id,
                        },
                    },
                });
                userFavorite = await prisma.favorite.findFirst({
                    where: {
                        userId: discussion.user.id,
                        episodeId: entity.id,
                    },
                });
                break;
        }

        // Get Clerk user data for discussion author and all comment authors
        const clerk = await clerkClient();
        
        // Get Clerk image for discussion author
        let discussionAuthorImage = null;
        try {
            const discussionAuthorClerkUser = await clerk.users.getUser(discussion.user.id);
            discussionAuthorImage = discussionAuthorClerkUser?.imageUrl;
        } catch (error) {
            console.error(`Failed to fetch Clerk user for discussion author ${discussion.user.id}:`, error);
        }

        // Get Clerk images for all comment authors
        const commentsWithClerkImages = await Promise.all(
            (discussion.comments || []).map(async (comment) => {
                try {
                    const clerkUser = await clerk.users.getUser(comment.user.id);
                    return {
                        ...comment,
                        user: {
                            ...comment.user,
                            profilePicture: clerkUser?.imageUrl,
                        },
                    };
                } catch (error) {
                    // If Clerk user lookup fails, log error but don't fall back
                    console.error(`Failed to fetch Clerk user for ${comment.user.id}:`, error);
                    return {
                        ...comment,
                        user: {
                            ...comment.user,
                            profilePicture: null,
                        },
                    };
                }
            })
        );

        // Add userRating and userFavorite to the discussion object
        const discussionWithRating = {
            ...discussion,
            user: {
                ...discussion.user,
                profilePicture: discussionAuthorImage,
            },
            comments: commentsWithClerkImages,
            userRating: userRating?.rating,
            userFavorite: !!userFavorite,
        };

        // Construct availableImages based on discussion type
        const availableImages = {
            episodeStillPath: discussionType === "episode" && 'stillPath' in entity ? entity.stillPath : null,
            seasonPosterPath: discussionType === "season" && 'posterPath' in entity ? entity.posterPath : 
                             discussionType === "episode" && 'season' in entity && 'posterPath' in entity.season ? entity.season.posterPath : null,
            showPosterPath: discussionType === "show" && 'posterPath' in entity ? entity.posterPath :
                           discussionType === "season" && 'show' in entity && 'posterPath' in entity.show ? entity.show.posterPath :
                           discussionType === "episode" && 'season' in entity && 'show' in entity.season && 'posterPath' in entity.season.show ? entity.season.show.posterPath : null,
        } as {
            episodeStillPath?: string | null;
            seasonPosterPath?: string | null;
            showPosterPath?: string | null;
        };



        return (
            <DiscussionDisplay
                discussion={discussionWithRating}
                discussionType={discussionType as "show" | "season" | "episode"}
                entity={entity}
                availableImages={availableImages}
            />
        );
    } catch (error) {
        console.error("Error fetching discussion:", error);
        notFound();
    }
}
