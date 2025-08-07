import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import ReviewDisplay from "@/components/ReviewDisplay";
import { notFound } from "next/navigation";

interface ReviewPageProps {
    params: Promise<{
        username: string;
        reviewType: string;
        reviewId: string;
    }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
    const { userId } = await auth();
    
    // Allow public access to view reviews, but userId will be null if not logged in

    const { username, reviewType, reviewId } = await params;

    // Validate review type
    if (!["show", "season", "episode"].includes(reviewType)) {
        notFound();
    }

    try {
        let review;
        let entity;

        switch (reviewType) {
            case "show":
                review = await prisma.showReview.findUnique({
                    where: { id: parseInt(reviewId) },
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
                        favouriteCharacters: {
                            include: {
                                character: {
                                    include: {
                                        person: true,
                                        season: {
                                            select: {
                                                id: true,
                                                seasonNumber: true,
                                            },
                                        },
                                    },
                                },
                            },
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
                entity = review?.show;
                break;

            case "season":
                review = await prisma.seasonReview.findUnique({
                    where: { id: parseInt(reviewId) },
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
                        favouriteCharacters: {
                            include: {
                                character: {
                                    include: {
                                        person: true,
                                        season: {
                                            select: {
                                                id: true,
                                                seasonNumber: true,
                                            },
                                        },
                                    },
                                },
                            },
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
                entity = review?.season;
                break;

            case "episode":
                review = await prisma.episodeReview.findUnique({
                    where: { id: parseInt(reviewId) },
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
                entity = review?.episode;
                break;
        }

        if (!review || !entity) {
            notFound();
        }

        // Verify the username matches the review author
        if (review.user.username !== username) {
            notFound();
        }

        // Get the reviewer's rating and favorite status for this entity
        let userRating;
        let userFavorite;
        switch (reviewType) {
            case "show":
                userRating = await prisma.rating.findUnique({
                    where: {
                        userId_showId: {
                            userId: review.user.id,
                            showId: entity.id,
                        },
                    },
                });
                userFavorite = await prisma.favorite.findFirst({
                    where: {
                        userId: review.user.id,
                        showId: entity.id,
                    },
                });
                break;
            case "season":
                userRating = await prisma.rating.findUnique({
                    where: {
                        userId_seasonId: {
                            userId: review.user.id,
                            seasonId: entity.id,
                        },
                    },
                });
                userFavorite = await prisma.favorite.findFirst({
                    where: {
                        userId: review.user.id,
                        seasonId: entity.id,
                    },
                });
                break;
            case "episode":
                userRating = await prisma.rating.findUnique({
                    where: {
                        userId_episodeId: {
                            userId: review.user.id,
                            episodeId: entity.id,
                        },
                    },
                });
                userFavorite = await prisma.favorite.findFirst({
                    where: {
                        userId: review.user.id,
                        episodeId: entity.id,
                    },
                });
                break;
        }

        // Get Clerk user data for review author and all comment authors
        const clerk = await clerkClient();
        
        // Get Clerk image for review author
        let reviewAuthorImage = null;
        try {
            const reviewAuthorClerkUser = await clerk.users.getUser(review.user.id);
            reviewAuthorImage = reviewAuthorClerkUser?.imageUrl;
        } catch (error) {
            console.error(`Failed to fetch Clerk user for review author ${review.user.id}:`, error);
        }

        // Get Clerk images for all comment authors
        const commentsWithClerkImages = await Promise.all(
            (review.comments || []).map(async (comment) => {
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

        // Add userRating and userFavorite to the review object
        const reviewWithRating = {
            ...review,
            user: {
                ...review.user,
                profilePicture: reviewAuthorImage,
            },
            comments: commentsWithClerkImages,
            userRating: userRating?.rating,
            userFavorite: !!userFavorite,
        };

        // Construct availableImages based on review type
        const availableImages = {
            episodeStillPath: reviewType === "episode" && 'stillPath' in entity ? entity.stillPath : null,
            seasonPosterPath: reviewType === "season" && 'posterPath' in entity ? entity.posterPath : 
                             reviewType === "episode" && 'season' in entity && 'posterPath' in entity.season ? entity.season.posterPath : null,
            showPosterPath: reviewType === "show" && 'posterPath' in entity ? entity.posterPath :
                           reviewType === "season" && 'show' in entity && 'posterPath' in entity.show ? entity.show.posterPath :
                           reviewType === "episode" && 'season' in entity && 'show' in entity.season && 'posterPath' in entity.season.show ? entity.season.show.posterPath : null,
        } as {
            episodeStillPath?: string | null;
            seasonPosterPath?: string | null;
            showPosterPath?: string | null;
        };

        return (
            <ReviewDisplay
                review={reviewWithRating}
                reviewType={reviewType as "show" | "season" | "episode"}
                entity={entity}
                availableImages={availableImages}
            />
        );
    } catch (error) {
        console.error("Error fetching review:", error);
        notFound();
    }
} 