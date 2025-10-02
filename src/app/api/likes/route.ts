import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import { trackEngagementSingle } from "@/lib/activityTracker";

// Helper function to track like engagement
async function trackLikeEngagement(entityType: string, entityId: number, userId: string) {
    try {
        let targetUserId = '';
        let activityType = '';
        let entityTypeEnum = '';
        let entityMetadata = {};

        // Get the content creator and entity details based on entity type
        switch (entityType) {
            case 'showReview':
                const showReview = await prisma.showReview.findUnique({
                    where: { id: entityId },
                    select: { 
                        userId: true,
                        content: true,
                        show: {
                            select: { name: true }
                        }
                    }
                });
                if (showReview) {
                    targetUserId = showReview.userId;
                    activityType = 'REVIEW_LIKED';
                    entityTypeEnum = 'REVIEW';
                    entityMetadata = {
                        entityName: showReview.show.name,
                        entityType: 'show',
                        entityId: entityId,
                        reviewContent: showReview.content.substring(0, 100) + (showReview.content.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'seasonReview':
                const seasonReview = await prisma.seasonReview.findUnique({
                    where: { id: entityId },
                    include: { 
                        season: {
                            include: { 
                                show: true
                            }
                        }
                    }
                });
                if (seasonReview) {
                    targetUserId = seasonReview.userId;
                    activityType = 'REVIEW_LIKED';
                    entityTypeEnum = 'REVIEW';
                    entityMetadata = {
                        entityName: `${seasonReview.season.show.name} ${seasonReview.season.seasonNumber === 0 ? 'Specials' : `Season ${seasonReview.season.seasonNumber}`}`,
                        entityType: 'season',
                        entityId: entityId,
                        reviewContent: seasonReview.content.substring(0, 100) + (seasonReview.content.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'episodeReview':
                const episodeReview = await prisma.episodeReview.findUnique({
                    where: { id: entityId },
                    include: { 
                        episode: {
                            include: { 
                                season: {
                                    include: {
                                        show: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (episodeReview) {
                    targetUserId = episodeReview.userId;
                    activityType = 'REVIEW_LIKED';
                    entityTypeEnum = 'REVIEW';
                    entityMetadata = {
                        entityName: `${episodeReview.episode.season.show.name} ${episodeReview.episode.season.seasonNumber === 0 ? 'Specials' : `Season ${episodeReview.episode.season.seasonNumber}`}, Episode ${episodeReview.episode.episodeNumber}: ${episodeReview.episode.name}`,
                        entityType: 'episode',
                        entityId: entityId,
                        reviewContent: episodeReview.content.substring(0, 100) + (episodeReview.content.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'discussion':
                const discussion = await prisma.discussion.findUnique({
                    where: { id: entityId },
                    select: { 
                        userId: true,
                        title: true,
                        content: true,
                        showId: true,
                        seasonId: true,
                        episodeId: true,
                        show: { select: { name: true } },
                        season: { select: { seasonNumber: true, show: { select: { name: true } } } },
                        episode: { select: { name: true, episodeNumber: true, season: { select: { seasonNumber: true, show: { select: { name: true } } } } } }
                    }
                });
                if (discussion) {
                    targetUserId = discussion.userId;
                    activityType = 'DISCUSSION_LIKED';
                    entityTypeEnum = 'DISCUSSION';
                    
                    // Determine the entity type and ID for the discussion
                    let discussionEntityType: 'show' | 'season' | 'episode' = 'show';
                    let discussionEntityId = discussion.showId;
                    let discussionAboutEntityName = '';
                    
                    if (discussion.episodeId && discussion.episode) {
                        discussionEntityType = 'episode';
                        discussionEntityId = discussion.episodeId;
                        discussionAboutEntityName = `${discussion.episode.season.show.name} Season ${discussion.episode.season.seasonNumber}, Episode ${discussion.episode.episodeNumber}: ${discussion.episode.name}`;
                    } else if (discussion.seasonId && discussion.season) {
                        discussionEntityType = 'season';
                        discussionEntityId = discussion.seasonId;
                        discussionAboutEntityName = `${discussion.season.show.name} Season ${discussion.season.seasonNumber}`;
                    } else if (discussion.show) {
                        discussionAboutEntityName = discussion.show.name;
                    }
                    
                    entityMetadata = {
                        entityName: discussion.title,
                        entityType: discussionEntityType,
                        entityId: discussionEntityId,
                        discussionContent: discussion.content.substring(0, 100) + (discussion.content.length > 100 ? '...' : ''),
                        discussionAboutEntityName: discussionAboutEntityName
                    };
                }
                break;
            case 'watchList':
                const watchList = await prisma.watchList.findUnique({
                    where: { id: entityId },
                    select: { 
                        userId: true,
                        name: true,
                        description: true
                    }
                });
                if (watchList) {
                    targetUserId = watchList.userId;
                    activityType = 'WATCHLIST_LIKED';
                    entityTypeEnum = 'WATCHLIST';
                    entityMetadata = {
                        entityName: watchList.name,
                        entityType: 'watchlist',
                        entityId: entityId,
                        watchlistDescription: watchList.description?.substring(0, 100) + (watchList.description && watchList.description.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'prediction':
                const prediction = await prisma.prediction.findUnique({
                    where: { id: entityId },
                    include: { 
                        episode: {
                            include: {
                                season: {
                                    include: {
                                        show: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (prediction) {
                    targetUserId = prediction.userId;
                    activityType = 'PREDICTION_LIKED';
                    entityTypeEnum = 'PREDICTION';
                    entityMetadata = {
                        entityName: `${prediction.episode.season.show.name} S${prediction.episode.season.seasonNumber}E${prediction.episode.episodeNumber}`,
                        entityType: 'prediction',
                        entityId: entityId,
                        predictionTitle: prediction.title,
                        predictionText: prediction.predictionText
                    };
                }
                break;
        }

        // Track engagement if we found the content creator and it's not the same user
        if (targetUserId && targetUserId !== userId && activityType && entityTypeEnum) {
            await trackEngagementSingle(
                userId, // giver
                targetUserId, // receiver
                activityType as 'REVIEW_LIKED' | 'DISCUSSION_LIKED' | 'WATCHLIST_LIKED' | 'PREDICTION_LIKED',
                entityTypeEnum as 'REVIEW' | 'DISCUSSION' | 'WATCHLIST' | 'PREDICTION',
                entityId,
                'Received a like',
                entityMetadata
            );
        }
    } catch (error) {
        console.error('Error tracking like engagement:', error);
        // Don't throw error to avoid breaking the like functionality
    }
}

// Helper function to track unlike engagement
async function trackUnlikeEngagement(entityType: string, entityId: number, userId: string) {
    try {
        let targetUserId = '';
        let activityType = '';
        let entityTypeEnum = '';
        let entityMetadata = {};

        // Get the content creator and entity details based on entity type
        switch (entityType) {
            case 'showReview':
                const showReview = await prisma.showReview.findUnique({
                    where: { id: entityId },
                    select: { 
                        userId: true,
                        content: true,
                        show: {
                            select: { name: true }
                        }
                    }
                });
                if (showReview) {
                    targetUserId = showReview.userId;
                    activityType = 'REVIEW_UNLIKED';
                    entityTypeEnum = 'REVIEW';
                    entityMetadata = {
                        entityName: showReview.show.name,
                        entityType: 'show',
                        entityId: entityId,
                        reviewContent: showReview.content.substring(0, 100) + (showReview.content.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'seasonReview':
                const seasonReview = await prisma.seasonReview.findUnique({
                    where: { id: entityId },
                    include: { 
                        season: {
                            include: { 
                                show: true
                            }
                        }
                    }
                });
                if (seasonReview) {
                    targetUserId = seasonReview.userId;
                    activityType = 'REVIEW_UNLIKED';
                    entityTypeEnum = 'REVIEW';
                    entityMetadata = {
                        entityName: `${seasonReview.season.show.name} ${seasonReview.season.seasonNumber === 0 ? 'Specials' : `Season ${seasonReview.season.seasonNumber}`}`,
                        entityType: 'season',
                        entityId: entityId,
                        reviewContent: seasonReview.content.substring(0, 100) + (seasonReview.content.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'episodeReview':
                const episodeReview = await prisma.episodeReview.findUnique({
                    where: { id: entityId },
                    include: { 
                        episode: {
                            include: { 
                                season: {
                                    include: {
                                        show: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (episodeReview) {
                    targetUserId = episodeReview.userId;
                    activityType = 'REVIEW_UNLIKED';
                    entityTypeEnum = 'REVIEW';
                    entityMetadata = {
                        entityName: `${episodeReview.episode.season.show.name} ${episodeReview.episode.season.seasonNumber === 0 ? 'Specials' : `Season ${episodeReview.episode.season.seasonNumber}`}, Episode ${episodeReview.episode.episodeNumber}: ${episodeReview.episode.name}`,
                        entityType: 'episode',
                        entityId: entityId,
                        reviewContent: episodeReview.content.substring(0, 100) + (episodeReview.content.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'discussion':
                const discussion = await prisma.discussion.findUnique({
                    where: { id: entityId },
                    select: { 
                        userId: true,
                        title: true,
                        content: true,
                        showId: true,
                        seasonId: true,
                        episodeId: true,
                        show: { select: { name: true } },
                        season: { select: { seasonNumber: true, show: { select: { name: true } } } },
                        episode: { select: { name: true, episodeNumber: true, season: { select: { seasonNumber: true, show: { select: { name: true } } } } } }
                    }
                });
                if (discussion) {
                    targetUserId = discussion.userId;
                    activityType = 'DISCUSSION_UNLIKED';
                    entityTypeEnum = 'DISCUSSION';
                    
                    // Determine the entity type and ID for the discussion
                    let discussionEntityType: 'show' | 'season' | 'episode' = 'show';
                    let discussionEntityId = discussion.showId;
                    let discussionAboutEntityName = '';
                    
                    if (discussion.episodeId && discussion.episode) {
                        discussionEntityType = 'episode';
                        discussionEntityId = discussion.episodeId;
                        discussionAboutEntityName = `${discussion.episode.season.show.name} Season ${discussion.episode.season.seasonNumber}, Episode ${discussion.episode.episodeNumber}: ${discussion.episode.name}`;
                    } else if (discussion.seasonId && discussion.season) {
                        discussionEntityType = 'season';
                        discussionEntityId = discussion.seasonId;
                        discussionAboutEntityName = `${discussion.season.show.name} Season ${discussion.season.seasonNumber}`;
                    } else if (discussion.show) {
                        discussionAboutEntityName = discussion.show.name;
                    }
                    
                    entityMetadata = {
                        entityName: discussion.title,
                        entityType: discussionEntityType,
                        entityId: discussionEntityId,
                        discussionContent: discussion.content.substring(0, 100) + (discussion.content.length > 100 ? '...' : ''),
                        discussionAboutEntityName: discussionAboutEntityName
                    };
                }
                break;
            case 'watchList':
                const watchList = await prisma.watchList.findUnique({
                    where: { id: entityId },
                    select: { 
                        userId: true,
                        name: true,
                        description: true
                    }
                });
                if (watchList) {
                    targetUserId = watchList.userId;
                    activityType = 'WATCHLIST_UNLIKED';
                    entityTypeEnum = 'WATCHLIST';
                    entityMetadata = {
                        entityName: watchList.name,
                        entityType: 'watchlist',
                        entityId: entityId,
                        watchlistDescription: watchList.description?.substring(0, 100) + (watchList.description && watchList.description.length > 100 ? '...' : '')
                    };
                }
                break;
            case 'prediction':
                const prediction = await prisma.prediction.findUnique({
                    where: { id: entityId },
                    include: { 
                        episode: {
                            include: {
                                season: {
                                    include: {
                                        show: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (prediction) {
                    targetUserId = prediction.userId;
                    activityType = 'PREDICTION_UNLIKED';
                    entityTypeEnum = 'PREDICTION';
                    entityMetadata = {
                        entityName: `${prediction.episode.season.show.name} S${prediction.episode.season.seasonNumber}E${prediction.episode.episodeNumber}`,
                        entityType: 'prediction',
                        entityId: entityId,
                        predictionTitle: prediction.title,
                        predictionText: prediction.predictionText
                    };
                }
                break;
        }

        // Track engagement if we found the content creator and it's not the same user
        if (targetUserId && targetUserId !== userId && activityType && entityTypeEnum) {
            await trackEngagementSingle(
                userId, // giver
                targetUserId, // receiver
                activityType as 'REVIEW_UNLIKED' | 'DISCUSSION_UNLIKED' | 'WATCHLIST_UNLIKED' | 'PREDICTION_UNLIKED',
                entityTypeEnum as 'REVIEW' | 'DISCUSSION' | 'WATCHLIST' | 'PREDICTION',
                entityId,
                'Received an unlike',
                entityMetadata
            );
        }
    } catch (error) {
        console.error('Error tracking unlike engagement:', error);
        // Don't throw error to avoid breaking the unlike functionality
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { entityType, entityId } = body;

        if (!entityType || !entityId) {
            return NextResponse.json(
                { error: "Missing entityType or entityId" },
                { status: 400 }
            );
        }

        // Check if like already exists
        const existingLike = await prisma.like.findFirst({
            where: {
                userId,
                ...(entityType === "comment" && { commentId: entityId }),
                ...(entityType === "review" && { reviewId: entityId }),
                ...(entityType === "prediction" && { predictionId: entityId }),
                ...(entityType === "showReview" && { showReviewId: entityId }),
                ...(entityType === "seasonReview" && { seasonReviewId: entityId }),
                ...(entityType === "episodeReview" && { episodeReviewId: entityId }),
                ...(entityType === "watchList" && { watchListId: entityId }),
                ...(entityType === "discussion" && { discussionId: entityId }),
            },
        });

        if (existingLike) {
            // Unlike - remove the like
            await prisma.like.delete({
                where: { id: existingLike.id },
            });

            // Track unlike activity
            await trackUnlikeEngagement(entityType, entityId, userId);

            return NextResponse.json({ liked: false });
        } else {
            // Like - create new like
            await prisma.like.create({
                data: {
                    userId,
                    ...(entityType === "comment" && { commentId: entityId }),
                    ...(entityType === "review" && { reviewId: entityId }),
                    ...(entityType === "prediction" && { predictionId: entityId }),
                    ...(entityType === "showReview" && { showReviewId: entityId }),
                    ...(entityType === "seasonReview" && { seasonReviewId: entityId }),
                    ...(entityType === "episodeReview" && { episodeReviewId: entityId }),
                    ...(entityType === "watchList" && { watchListId: entityId }),
                    ...(entityType === "discussion" && { discussionId: entityId }),
                },
            });

            // Track engagement and award points to content creator
            await trackLikeEngagement(entityType, entityId, userId);

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("Error handling like:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get("entityType");
        const entityId = searchParams.get("entityId");

        if (!entityType || !entityId) {
            return NextResponse.json(
                { error: "Missing entityType or entityId" },
                { status: 400 }
            );
        }

        // Get like count and user's like status
        const [likeCount, userLike] = await Promise.all([
            prisma.like.count({
                where: {
                    ...(entityType === "comment" && { commentId: parseInt(entityId) }),
                    ...(entityType === "review" && { reviewId: parseInt(entityId) }),
                    ...(entityType === "prediction" && { predictionId: parseInt(entityId) }),
                    ...(entityType === "showReview" && { showReviewId: parseInt(entityId) }),
                    ...(entityType === "seasonReview" && { seasonReviewId: parseInt(entityId) }),
                    ...(entityType === "episodeReview" && { episodeReviewId: parseInt(entityId) }),
                    ...(entityType === "watchList" && { watchListId: parseInt(entityId) }),
                    ...(entityType === "discussion" && { discussionId: parseInt(entityId) }),
                },
            }),
            prisma.like.findFirst({
                where: {
                    userId,
                    ...(entityType === "comment" && { commentId: parseInt(entityId) }),
                    ...(entityType === "review" && { reviewId: parseInt(entityId) }),
                    ...(entityType === "prediction" && { predictionId: parseInt(entityId) }),
                    ...(entityType === "showReview" && { showReviewId: parseInt(entityId) }),
                    ...(entityType === "seasonReview" && { seasonReviewId: parseInt(entityId) }),
                    ...(entityType === "episodeReview" && { episodeReviewId: parseInt(entityId) }),
                    ...(entityType === "watchList" && { watchListId: parseInt(entityId) }),
                    ...(entityType === "discussion" && { discussionId: parseInt(entityId) }),
                },
            }),
        ]);

        return NextResponse.json({
            likeCount,
            isLiked: !!userLike,
        });
    } catch (error) {
        console.error("Error getting like info:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 