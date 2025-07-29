import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { showId, content, startedOn, endedOn, tags, spoiler, favouriteCharacters } = await request.json();

        // Validate required fields
        if (!showId || !content) {
            return NextResponse.json(
                { error: "Show ID and content are required" },
                { status: 400 }
            );
        }

        // Check if show exists
        const show = await prisma.show.findUnique({
            where: { id: showId },
        });

        if (!show) {
            return NextResponse.json({ error: "Show not found" }, { status: 404 });
        }

        // Create the review
        const review = await prisma.showReview.create({
            data: {
                content,
                userId,
                showId,
                startedOn: startedOn ? new Date(startedOn) : null,
                endedOn: endedOn ? new Date(endedOn) : null,
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
                await prisma.showReviewTag.create({
                    data: {
                        showReviewId: review.id,
                        tagId: tag.id,
                    },
                });
            }
        }

        // Handle favourite characters
        if (favouriteCharacters && favouriteCharacters.length > 0) {
            for (const characterId of favouriteCharacters) {
                // Verify the character exists and belongs to this show
                const character = await prisma.character.findFirst({
                    where: {
                        id: characterId,
                        season: {
                            showId: showId
                        }
                    },
                });

                if (character) {
                    await prisma.showReviewCharacter.create({
                        data: {
                            showReviewId: review.id,
                            characterId: characterId,
                        },
                    });
                }
            }
        }

        return NextResponse.json({ 
            message: "Review submitted successfully",
            reviewId: review.id,
            review: {
                id: review.id,
                content: review.content,
                startedOn: review.startedOn,
                endedOn: review.endedOn,
                spoiler: review.spoiler,
                createdAt: review.createdAt,
            }
        });

    } catch (error) {
        console.error("Error creating show review:", error);
        return NextResponse.json(
            { error: "Failed to submit review" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const showId = searchParams.get("showId");

        if (!showId) {
            return NextResponse.json(
                { error: "Show ID is required" },
                { status: 400 }
            );
        }

        const reviews = await prisma.showReview.findMany({
            where: { showId: parseInt(showId) },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
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
                        where: { showReviewId: review.id },
                    }),
                    prisma.reviewComment.count({
                        where: { showReviewId: review.id },
                    }),
                    prisma.rating.findUnique({
                        where: {
                            userId_showId: {
                                userId: review.user.id,
                                showId: parseInt(showId),
                            },
                        },
                    }),
                    prisma.favorite.findFirst({
                        where: {
                            userId: review.user.id,
                            showId: parseInt(showId),
                        },
                    }),
                ]);

                return {
                    ...review,
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
        console.error("Error fetching show reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
} 