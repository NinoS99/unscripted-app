import { PrismaClient, ActivityType, EntityType, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to build timezone-aware date conditions
function buildTimezoneAwareDateConditions(dateFilter: {
  year?: number;
  month?: number;
  day?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const conditions: Record<string, unknown> = {};
  
  if (dateFilter.startDate && dateFilter.endDate) {
    // Create start date at 00:00:00 UTC
    const startDate = new Date(dateFilter.startDate);
    const startOfDay = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      0, 0, 0, 0
    ));
    
    // Create end date at 23:59:59.999 UTC
    const endDate = new Date(dateFilter.endDate);
    const endOfDay = new Date(Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      23, 59, 59, 999
    ));
                
    conditions.createdAt = {
      gte: startOfDay,
      lte: endOfDay
    };
  } else if (dateFilter.startDate) {
    // Create start date at 00:00:00 UTC
    const startDate = new Date(dateFilter.startDate);
    const startOfDay = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      0, 0, 0, 0
    ));
    
    conditions.createdAt = {
      gte: startOfDay
    };
  } else if (dateFilter.endDate) {
    // Create end date at 23:59:59.999 UTC
    const endDate = new Date(dateFilter.endDate);
    const endOfDay = new Date(Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      23, 59, 59, 999
    ));
        
    conditions.createdAt = {
      lte: endOfDay
    };
  } else if (dateFilter.year || dateFilter.month || dateFilter.day) {
    // Build date range for specific year/month/day
    const year = dateFilter.year || new Date().getFullYear();
    const month = dateFilter.month || 1;
    const day = dateFilter.day || 1;
    
    const startDate = new Date(year, month - 1, day);
    const endDate = new Date(year, month - 1, day + 1);
    
    conditions.createdAt = {
      gte: startDate,
      lt: endDate
    };
  }
  
  return conditions;
}

// Point values for different activities
const POINT_VALUES: Record<ActivityType, number> = {
  // Content creation
  REVIEW_CREATED: 10,
  DISCUSSION_CREATED: 10,
  WATCHLIST_CREATED: 10,
  PREDICTION_CREATED: 10,
  COMMENT_CREATED: 0,
  
  // Engagement (awarded to content creator)
  REVIEW_LIKED: 2,
  REVIEW_UNLIKED: 0, // No points for unlikes
  DISCUSSION_LIKED: 2,
  DISCUSSION_UNLIKED: 0, // No points for unlikes
  WATCHLIST_LIKED: 2,
  WATCHLIST_UNLIKED: 0, // No points for unlikes
  PREDICTION_LIKED: 2,
  PREDICTION_UNLIKED: 0, // No points for unlikes
  COMMENT_UPVOTED: 1,
  COMMENT_DOWNVOTED: 0, // No points for downvotes
  
  // Prediction market
  SHARES_PURCHASED: 0, // Points spent, not earned
  SHARES_SOLD: 0, // Points returned
  PREDICTION_WON: 0, // Variable based on winnings
  PREDICTION_LOST: 0, // No points for losses
  
  // Social
  USER_FOLLOWED: 0,
  USER_UNFOLLOWED: 0
};

// Helper function to get point value, ensuring givers don't get points
function getPointValueForActivity(activityType: ActivityType, isGiver: boolean = false): number {
  if (isGiver) {
    // Givers never get points for giving likes/votes
    return 0;
  }
  return POINT_VALUES[activityType] || 0;
}

// Standardized metadata interface for consistent activity descriptions
export interface StandardizedMetadata {
  // Entity information for content creation
  entityType?: 'show' | 'season' | 'episode' | 'watchlist' | 'discussion' | 'review';
  entityName?: string; // Display name for the entity (e.g., "The Kardashians", "Love Island Season 2")
  entityId?: string | number; // ID for linking
  
  // Content-specific IDs for linking
  reviewId?: string | number;
  discussionId?: string | number;
  watchListId?: string | number;
  
  // Context for comments
  contentType?: 'show' | 'season' | 'episode' | 'watchlist' | 'discussion'; // What type of content was commented on
  contentName?: string; // Name of the content being commented on
  
  // Engagement context
  receiverUsername?: string; // Username of the person who received the action
  receiverUserId?: string; // User ID of the receiver
  
  // Additional context
  commentLength?: number;
  discussionTitle?: string;
  watchlistName?: string;
  reviewLength?: number;
  hasTags?: boolean;
  hasPoll?: boolean;
  showCount?: number;
  isPublic?: boolean;
  friendsOnly?: boolean;
  isRanked?: boolean;
  
  // Legacy fields (to be removed eventually)
  [key: string]: string | number | boolean | undefined;
}

export interface ActivityData {
  userId: string;
  activityType: ActivityType;
  entityType?: EntityType;
  entityId?: number;
  description?: string;
  metadata?: StandardizedMetadata;
  giverId?: string; // Who performed the action (for likes, votes, etc.)
}

export async function trackUserActivity(data: ActivityData) {
  const { userId, activityType, entityType, entityId, description, metadata, giverId } = data;
  const points = getPointValueForActivity(activityType, false); // Receivers get points
  
  try {
    // Create activity record
    await prisma.userActivity.create({
      data: {
        userId,
        activityType,
        entityType,
        entityId,
        points,
        description,
        metadata,
        giverId
      }
    });

    // Update user points if points were earned
    if (points > 0) {
      await updateUserPoints(userId, points, activityType, entityType, entityId);
    }
  } catch (error) {
    console.error('Error tracking user activity:', error);
    throw error;
  }
}

async function updateUserPoints(
  userId: string, 
  points: number, 
  activityType: ActivityType,
  entityType?: EntityType,
  entityId?: number
) {
  // Update user points balance
  await prisma.userPoints.upsert({
    where: { userId },
    update: {
      balance: { increment: points },
      totalEarned: { increment: points },
      lastUpdated: new Date()
    },
    create: {
      userId,
      balance: points,
      totalEarned: points
    }
  });

  // Create transaction record
  await prisma.pointsTransaction.create({
    data: {
      userId,
      amount: points,
      type: 'EARNED',
      description: `Earned ${points} points for ${activityType}`,
      referenceId: entityId,
      referenceType: entityType
    }
  });
}

export async function trackMultipleActivities(activities: ActivityData[]) {
  try {
    // Batch create activities
    await prisma.userActivity.createMany({
      data: activities.map(activity => ({
        ...activity,
        points: getPointValueForActivity(activity.activityType, false)
      }))
    });

    // Group points by user
    const userPoints = activities.reduce((acc, activity) => {
      const points = getPointValueForActivity(activity.activityType, false);
      if (points > 0) {
        if (!acc[activity.userId]) {
          acc[activity.userId] = { totalPoints: 0, activities: [] };
        }
        acc[activity.userId].totalPoints += points;
        acc[activity.userId].activities.push(activity);
      }
      return acc;
    }, {} as Record<string, { totalPoints: number; activities: ActivityData[] }>);

    // Batch update user points
    for (const [userId, { totalPoints, activities: userActivities }] of Object.entries(userPoints)) {
      await prisma.userPoints.upsert({
        where: { userId },
        update: {
          balance: { increment: totalPoints },
          totalEarned: { increment: totalPoints },
          lastUpdated: new Date()
        },
        create: {
          userId,
          balance: totalPoints,
          totalEarned: totalPoints
        }
      });

      // Create transaction records
      await prisma.pointsTransaction.createMany({
        data: userActivities.map(activity => ({
          userId,
          amount: getPointValueForActivity(activity.activityType, false),
          type: 'EARNED' as TransactionType,
          description: `Earned ${getPointValueForActivity(activity.activityType, false)} points for ${activity.activityType}`,
          referenceId: activity.entityId,
          referenceType: activity.entityType
        }))
      });
    }
  } catch (error) {
    console.error('Error tracking multiple activities:', error);
    throw error;
  }
}

// Helper function to get point value for an activity type
export function getPointValue(activityType: ActivityType): number {
  return getPointValueForActivity(activityType, false);
}

// Helper function to track engagement (likes, votes, etc.)
export async function trackEngagement(
  targetUserId: string,
  activityType: ActivityType,
  entityType: EntityType,
  entityId: number,
  description?: string,
  giverId?: string
) {
  if (targetUserId) {
    await trackUserActivity({
      userId: targetUserId,
      activityType,
      entityType,
      entityId,
      description,
      giverId
    });
  }
}

// Helper function to track engagement with single entry
export async function trackEngagementSingle(
  giverId: string,
  receiverId: string,
  activityType: ActivityType,
  entityType: EntityType,
  entityId: number,
  description?: string,
  entityMetadata?: object
) {
  // Check if this user has already liked this entity
  const existingActivity = await prisma.userActivity.findFirst({
    where: {
      userId: receiverId,
      giverId: giverId,
      entityType,
      entityId,
      activityType: {
        in: ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED']
      }
    }
  });

  if (existingActivity) {
    // If it's the same activity type, don't create duplicate
    if (existingActivity.activityType === activityType) {
      return;
    }
    
    // If it's a different activity type (like vs unlike), update the existing record
    await prisma.userActivity.update({
      where: { id: existingActivity.id },
      data: {
        activityType,
        description: description || 'Received a like',
        metadata: entityMetadata,
        points: getPointValueForActivity(activityType, false)
      }
    });

    // Update user points - only award points, never deduct them
    const oldPoints = getPointValueForActivity(existingActivity.activityType, false);
    const newPoints = getPointValueForActivity(activityType, false);
    
    // Only award points if this is the first time earning points for this entity
    // and the new activity type awards points
    if (newPoints > 0 && oldPoints === 0) {
      // Check if this user has already earned points for this specific engagement
      const existingTransaction = await prisma.pointsTransaction.findFirst({
        where: {
          userId: receiverId,
          referenceId: entityId,
          referenceType: entityType,
          type: 'EARNED'
        }
      });

      // Only award points if this is the first time earning points for this entity
      if (!existingTransaction) {
        await prisma.userPoints.upsert({
          where: { userId: receiverId },
          update: {
            balance: { increment: newPoints },
            totalEarned: { increment: newPoints },
            lastUpdated: new Date()
          },
          create: {
            userId: receiverId,
            balance: newPoints,
            totalEarned: newPoints
          }
        });

        // Create transaction record for the point award
        await prisma.pointsTransaction.create({
          data: {
            userId: receiverId,
            amount: newPoints,
            type: 'EARNED',
            description: `Points earned for ${activityType}`,
            referenceId: entityId,
            referenceType: entityType
          }
        });
      }
    }
  } else {
    // Create new activity entry for the receiver with giver info
    // Only track points for positive activities (likes, not unlikes)
    const points = getPointValueForActivity(activityType, false);
    
    await prisma.userActivity.create({
      data: {
        userId: receiverId,
        activityType,
        entityType,
        entityId,
        points,
        description: description || 'Received a like',
        metadata: entityMetadata,
        giverId
      }
    });

    // Update user points only if points were earned
    if (points > 0) {
      await updateUserPoints(receiverId, points, activityType, entityType, entityId);
    }
  }
}


// Helper function to get user activities with giver information
export async function getUserActivities(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  activityTypes?: ActivityType[],
  dateFilter?: {
    year?: number;
    month?: number;
    day?: number;
    startDate?: Date;
    endDate?: Date;
  },
  includePrivate: boolean = false
) {
  const whereClause: Record<string, unknown> = { userId };
  
  if (activityTypes && activityTypes.length > 0) {
    whereClause.activityType = { in: activityTypes };
  }

  // Privacy filtering
  if (!includePrivate) {
    whereClause.isPublic = true;
  }

  // Date filtering - both dates are now in UTC
  if (dateFilter) {
    const dateConditions = buildTimezoneAwareDateConditions(dateFilter);
    Object.assign(whereClause, dateConditions);
  }

  const activities = await prisma.userActivity.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      },
      giver: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  return activities;
}

// Helper function to get activities where user was the giver (for "You liked..." activities)
export async function getUserGiverActivities(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  activityTypes?: ActivityType[],
  dateFilter?: {
    year?: number;
    month?: number;
    day?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const whereClause: Record<string, unknown> = { giverId: userId };
  
  if (activityTypes && activityTypes.length > 0) {
    whereClause.activityType = { in: activityTypes };
  }

  // Date filtering with timezone awareness
  if (dateFilter) {
    const dateConditions = buildTimezoneAwareDateConditions(dateFilter);
    Object.assign(whereClause, dateConditions);
  }

  const activities = await prisma.userActivity.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      },
      giver: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  return activities;
}

// Helper function to get activities where user was the receiver (for "incoming" activities)
export async function getUserReceiverActivities(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  activityTypes?: ActivityType[],
  dateFilter?: {
    year?: number;
    month?: number;
    day?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const whereClause: Record<string, unknown> = { 
    userId: userId,
    giverId: { not: null } // Only activities where someone else performed the action
  };
  
  if (activityTypes && activityTypes.length > 0) {
    whereClause.activityType = { in: activityTypes };
  }

  // Date filtering with timezone awareness
  if (dateFilter) {
    const dateConditions = buildTimezoneAwareDateConditions(dateFilter);
    Object.assign(whereClause, dateConditions);
  }

  const activities = await prisma.userActivity.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      },
      giver: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  return activities;
}
