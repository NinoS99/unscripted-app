import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { seasonId, content, startedOn, endedOn, tags, spoiler, favouriteCharacters } = await request.json();

        // Validate required fields
        if (!seasonId || !content) {
            return NextResponse.json(
                { error: "Season ID and content are required" },
                { status: 400 }
            );
        }

        // Check if season exists
        const season = await prisma.season.findUnique({
            where: { id: seasonId },
            include: {
                show: true,
                characters: true,
            },
        });

        if (!season) {
            return NextResponse.json({ error: "Season not found" }, { status: 404 });
        }

        // Create the review
        const review = await prisma.seasonReview.create({
            data: {
                content,
                userId,
                seasonId,
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
                await prisma.seasonReviewTag.create({
                    data: {
                        seasonReviewId: review.id,
                        tagId: tag.id,
                    },
                });
            }
        }

        // Handle favourite characters
        if (favouriteCharacters && favouriteCharacters.length > 0) {
            for (const characterId of favouriteCharacters) {
                // Verify the character exists and belongs to this season
                const character = await prisma.character.findFirst({
                    where: {
                        id: characterId,
                        seasonId: seasonId
                    },
                });

                if (character) {
                    await prisma.seasonReviewCharacter.create({
                        data: {
                            seasonReviewId: review.id,
                            characterId: characterId,
                        },
                    });
                }
            }
        }

        return NextResponse.json({ 
            message: "Season review submitted successfully",
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
        console.error("Error creating season review:", error);
        return NextResponse.json(
            { error: "Failed to submit season review" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get("seasonId");

        if (!seasonId) {
            return NextResponse.json(
                { error: "Season ID is required" },
                { status: 400 }
            );
        }

        const reviews = await prisma.seasonReview.findMany({
            where: { seasonId: parseInt(seasonId) },
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
                        where: { seasonReviewId: review.id },
                    }),
                    prisma.reviewComment.count({
                        where: { seasonReviewId: review.id },
                    }),
                    prisma.rating.findUnique({
                        where: {
                            userId_seasonId: {
                                userId: review.user.id,
                                seasonId: parseInt(seasonId),
                            },
                        },
                    }),
                    prisma.favorite.findFirst({
                        where: {
                            userId: review.user.id,
                            seasonId: parseInt(seasonId),
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
        console.error("Error fetching season reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch season reviews" },
            { status: 500 }
        );
    }
} 