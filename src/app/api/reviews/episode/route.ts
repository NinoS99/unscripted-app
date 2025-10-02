import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import { trackUserActivity } from "@/lib/activityTracker";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { episodeId, content, watchedOn, tags, spoiler } = await request.json();

        // Validate required fields
        if (!episodeId || !content) {
            return NextResponse.json(
                { error: "Episode ID and content are required" },
                { status: 400 }
            );
        }

        // Check if episode exists
        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: {
                season: {
                    include: {
                        show: true,
                        characters: true,
                    },
                },
            },
        });

        if (!episode) {
            return NextResponse.json({ error: "Episode not found" }, { status: 404 });
        }

        // Create the review
        const review = await prisma.episodeReview.create({
            data: {
                content,
                userId,
                episodeId,
                watchedOn: watchedOn ? new Date(watchedOn) : null,
                spoiler: spoiler || false,
            },
        });

        // Handle tags
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // Find or create the tag
                let tag = await prisma.tag.findUnique({
                    where: { name: tagName },
                });

                if (!tag) {
                    tag = await prisma.tag.create({
                        data: { name: tagName },
                    });
                }

                // Create the review-tag association
                await prisma.episodeReviewTag.create({
                    data: {
                        episodeReviewId: review.id,
                        tagId: tag.id,
                    },
                });
            }
        }

        // Track user activity and award points
        await trackUserActivity({
            userId,
            activityType: 'REVIEW_CREATED',
            entityType: 'REVIEW',
            entityId: review.id,
            description: 'Created an episode review',
            metadata: {
                entityType: 'episode',
                entityName: `${episode.season.show.name} ${episode.season.seasonNumber === 0 ? 'Specials' : `Season ${episode.season.seasonNumber}`}, Episode ${episode.episodeNumber}: ${episode.name}`,
                entityId: episodeId,
                reviewId: review.id,
                reviewLength: content.length,
                hasTags: tags && tags.length > 0,
                watchedOn: watchedOn ? new Date(watchedOn).toISOString() : undefined
            }
        });

        return NextResponse.json({ 
            message: "Episode review submitted successfully",
            reviewId: review.id,
            review: {
                id: review.id,
                content: review.content,
                watchedOn: review.watchedOn,
                spoiler: review.spoiler,
                createdAt: review.createdAt,
            }
        });

    } catch (error) {
        console.error("Error creating episode review:", error);
        return NextResponse.json(
            { error: "Failed to submit episode review" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const episodeId = searchParams.get("episodeId");

        if (!episodeId) {
            return NextResponse.json(
                { error: "Episode ID is required" },
                { status: 400 }
            );
        }

        const reviews = await prisma.episodeReview.findMany({
            where: { episodeId: parseInt(episodeId) },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Add _count data for likes and comments, plus user's rating and favorite status
        const reviewsWithCounts = await Promise.all(
            reviews.map(async (review) => {
                const [likesCount, commentsCount, userRating, userFavorite] = await Promise.all([
                    prisma.like.count({
                        where: { episodeReviewId: review.id },
                    }),
                    prisma.reviewComment.count({
                        where: { episodeReviewId: review.id },
                    }),
                    prisma.rating.findUnique({
                        where: {
                            userId_episodeId: {
                                userId: review.user.id,
                                episodeId: parseInt(episodeId),
                            },
                        },
                    }),
                    prisma.favorite.findFirst({
                        where: {
                            userId: review.user.id,
                            episodeId: parseInt(episodeId),
                            },
                        }),
                ]);

                // Get Clerk imageUrl for the review author
                let profilePicture = null;
                try {
                    const clerk = await clerkClient();
                    const clerkUser = await clerk.users.getUser(review.user.id);
                    profilePicture = clerkUser?.imageUrl;
                } catch (error) {
                    console.error(`Failed to fetch Clerk user for ${review.user.id}:`, error);
                }

                return {
                    ...review,
                    user: {
                        ...review.user,
                        profilePicture,
                    },
                    _count: {
                        likes: likesCount,
                        comments: commentsCount,
                    },
                    userRating: userRating?.rating,
                    userFavorite: !!userFavorite,
                };
            })
        );

        return NextResponse.json({ reviews: reviewsWithCounts });

    } catch (error) {
        console.error("Error fetching episode reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch episode reviews" },
            { status: 500 }
        );
    }
} 