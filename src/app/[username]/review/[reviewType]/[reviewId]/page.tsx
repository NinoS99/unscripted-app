import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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
    
    // Redirect if not logged in
    if (!userId) {
        redirect("/sign-in");
    }

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
                                    },
                                },
                            },
                        },
                        likes: {
                            where: { userId },
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
                                    },
                                },
                            },
                        },
                        likes: {
                            where: { userId },
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
                        likes: {
                            where: { userId },
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

        // Get the reviewer's rating for this entity
        let userRating;
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
                break;
        }

        // Add userRating to the review object
        const reviewWithRating = {
            ...review,
            userRating: userRating?.rating,
        };

        // Construct availableImages based on review type
        const availableImages = {
            episodeStillPath: reviewType === "episode" && 'stillPath' in entity ? entity.stillPath : null,
            seasonPosterPath: reviewType === "season" && 'posterPath' in entity ? entity.posterPath : 
                             reviewType === "episode" && 'season' in entity && 'posterPath' in entity.season ? entity.season.posterPath : null,
            showPosterPath: reviewType === "show" && 'posterPath' in entity ? entity.posterPath :
                           reviewType === "episode" && 'season' in entity && 'show' in entity.season && 'posterPath' in entity.season.show ? entity.season.show.posterPath : null,
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