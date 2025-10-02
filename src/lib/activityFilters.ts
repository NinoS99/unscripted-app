import { PrismaClient, ActivityType, ActivityGroup } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to get activities by activity group
export async function getUserActivitiesByGroup(
  userId: string,
  activityGroups: ActivityGroup[],
  limit: number = 20,
  offset: number = 0,
  dateFilter?: {
    year?: number;
    month?: number;
    day?: number;
    startDate?: Date;
    endDate?: Date;
  },
  includePrivate: boolean = false
) {
  // First get activity types for the specified groups
  const groupMappings = await prisma.activityGroupMapping.findMany({
    where: {
      activityGroup: { in: activityGroups }
    },
    select: {
      activityType: true
    }
  });

  const activityTypes = groupMappings.map(mapping => mapping.activityType);
  
  if (activityTypes.length === 0) {
    return [];
  }

  // Import the getUserActivities function from activityTracker
  const { getUserActivities } = await import('./activityTracker');
  return getUserActivities(
    userId,
    limit,
    offset,
    activityTypes,
    dateFilter,
    includePrivate
  );
}

// Helper function to get user's privacy settings for activity groups
export async function getUserActivityPrivacy(userId: string) {
  const privacySettings = await prisma.userActivityPrivacy.findMany({
    where: { userId },
    select: {
      activityGroup: true,
      isPublic: true
    }
  });

  return privacySettings;
}

// Helper function to get activities respecting user's privacy settings
export async function getUserActivitiesWithPrivacy(
  userId: string,
  viewerId?: string, // ID of user viewing the activities
  limit: number = 20,
  offset: number = 0,
  activityTypes?: ActivityType[],
  activityGroups?: ActivityGroup[],
  dateFilter?: {
    year?: number;
    month?: number;
    day?: number;
    startDate?: Date;
    endDate?: Date;
  },
  filterMode?: 'you' | 'incoming' // New filter mode parameter
) {
  // Import the getUserActivities, getUserGiverActivities, and getUserReceiverActivities functions from activityTracker
  const { getUserActivities, getUserGiverActivities, getUserReceiverActivities } = await import('./activityTracker');

  // If viewing own activities, handle different filter modes
  if (viewerId === userId) {
    // Handle "you" filter mode - show what the user did (giver activities + content creation)
    if (filterMode === 'you') {
      // Use the same logic as viewing someone else's profile, but for giver activities
      if (activityGroups && activityGroups.length > 0) {
        const results = [];
        
        // Separate groups by query type
        const engagementGroups = activityGroups.filter(group => 
          group === 'ENGAGEMENT' || group === 'DISENGAGEMENT'
        );
        const nonEngagementGroups = activityGroups.filter(group => 
          group === 'CONTENT_CREATION' || group === 'PREDICTION_MARKET' || group === 'SOCIAL'
        );
        
        // Get ENGAGEMENT activities where user was the giver
        if (engagementGroups.length > 0) {
          const engagementTypes = await prisma.activityGroupMapping.findMany({
            where: { activityGroup: { in: engagementGroups } },
            select: { activityType: true }
          });
          
          const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
          const engagementActivities = await getUserGiverActivities(userId, limit, offset, engagementActivityTypes, dateFilter);
          results.push(...engagementActivities);
        }
        
        // Get non-ENGAGEMENT activities where user was the creator
        if (nonEngagementGroups.length > 0) {
          const nonEngagementTypes = await prisma.activityGroupMapping.findMany({
            where: { activityGroup: { in: nonEngagementGroups } },
            select: { activityType: true }
          });
          
          const nonEngagementActivityTypes = nonEngagementTypes.map(mapping => mapping.activityType);
          const nonEngagementActivities = await getUserActivities(userId, limit, offset, nonEngagementActivityTypes, dateFilter, false);
          results.push(...nonEngagementActivities);
        }
        
        // Sort by creation date and limit results
        return results
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      }
      
      // If filtering by activity types
      if (activityTypes && activityTypes.length > 0) {
        const groupMappings = await prisma.activityGroupMapping.findMany({
          where: {
            activityType: { in: activityTypes }
          },
          select: {
            activityType: true,
            activityGroup: true
          }
        });

        const results = [];
        
        // Separate by group type
        const giverTypes = groupMappings
          .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT')
          .map(mapping => mapping.activityType);
        
        const creatorTypes = groupMappings
          .filter(mapping => mapping.activityGroup === 'CONTENT_CREATION' || mapping.activityGroup === 'PREDICTION_MARKET' || mapping.activityGroup === 'SOCIAL')
          .map(mapping => mapping.activityType);

        // Get giver activities
        if (giverTypes.length > 0) {
          const giverActivities = await getUserGiverActivities(userId, limit, offset, giverTypes, dateFilter);
          results.push(...giverActivities);
        }

        // Get creator activities
        if (creatorTypes.length > 0) {
          const creatorActivities = await getUserActivities(userId, limit, offset, creatorTypes, dateFilter, false);
          results.push(...creatorActivities);
        }

        // Sort by creation date and limit results
        return results
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      }
      
      // No specific filters, get all activities (giver + content creation)
      const engagementActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED'] as ActivityType[];
      const contentCreationActivityTypes = ['REVIEW_CREATED', 'DISCUSSION_CREATED', 'WATCHLIST_CREATED', 'PREDICTION_CREATED'] as ActivityType[];
      
      const engagementActivities = await getUserGiverActivities(userId, limit, offset, engagementActivityTypes, dateFilter);
      const contentCreationActivities = await getUserActivities(userId, limit, offset, contentCreationActivityTypes, dateFilter, false);
      
      const filteredContentCreationActivities = contentCreationActivities.filter(activity => 
        activity.giverId === null
      );
      
      const allActivities = [...engagementActivities, ...filteredContentCreationActivities]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
      
      return allActivities;
    }
    
    // Handle "incoming" filter mode - show what the user received
    if (filterMode === 'incoming') {
      if (activityGroups && activityGroups.length > 0) {
        const engagementGroups = activityGroups.filter(group => 
          group === 'ENGAGEMENT' || group === 'DISENGAGEMENT'
        );
        
        if (engagementGroups.length > 0) {
          const engagementTypes = await prisma.activityGroupMapping.findMany({
            where: { activityGroup: { in: engagementGroups } },
            select: { activityType: true }
          });
          
          const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
          return await getUserReceiverActivities(userId, limit, offset, engagementActivityTypes, dateFilter);
        }
        
        return [];
      }
      
      if (activityTypes && activityTypes.length > 0) {
        const groupMappings = await prisma.activityGroupMapping.findMany({
          where: {
            activityType: { in: activityTypes }
          },
          select: {
            activityType: true,
            activityGroup: true
          }
        });

        const giverTypes = groupMappings
          .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT')
          .map(mapping => mapping.activityType);
        
        if (giverTypes.length > 0) {
          return await getUserReceiverActivities(userId, limit, offset, giverTypes, dateFilter);
        }
        
        return [];
      }
      
      // No specific filters, get all receiver activities
      const engagementActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED'] as ActivityType[];
      return await getUserReceiverActivities(userId, limit, offset, engagementActivityTypes, dateFilter);
    }
    
    // Default "you" mode - show what they did (giver activities + content creation)
    // Use the same logic as "you" mode above
    if (activityGroups && activityGroups.length > 0) {
      const results = [];
      
      const engagementGroups = activityGroups.filter(group => 
        group === 'ENGAGEMENT' || group === 'DISENGAGEMENT'
      );
      const nonEngagementGroups = activityGroups.filter(group => 
        group === 'CONTENT_CREATION' || group === 'PREDICTION_MARKET' || group === 'SOCIAL'
      );
      
      if (engagementGroups.length > 0) {
        const engagementTypes = await prisma.activityGroupMapping.findMany({
          where: { activityGroup: { in: engagementGroups } },
          select: { activityType: true }
        });
        
        const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
        const engagementActivities = await getUserGiverActivities(userId, limit, offset, engagementActivityTypes, dateFilter);
        results.push(...engagementActivities);
      }
      
      if (nonEngagementGroups.length > 0) {
        const nonEngagementTypes = await prisma.activityGroupMapping.findMany({
          where: { activityGroup: { in: nonEngagementGroups } },
          select: { activityType: true }
        });
        
        const nonEngagementActivityTypes = nonEngagementTypes.map(mapping => mapping.activityType);
        const nonEngagementActivities = await getUserActivities(userId, limit, offset, nonEngagementActivityTypes, dateFilter, false);
        results.push(...nonEngagementActivities);
      }
      
      return results
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
    
    if (activityTypes && activityTypes.length > 0) {
      const groupMappings = await prisma.activityGroupMapping.findMany({
        where: {
          activityType: { in: activityTypes }
        },
        select: {
          activityType: true,
          activityGroup: true
        }
      });

      const results = [];
      
      const giverTypes = groupMappings
        .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT')
        .map(mapping => mapping.activityType);
      
      const creatorTypes = groupMappings
        .filter(mapping => mapping.activityGroup === 'CONTENT_CREATION' || mapping.activityGroup === 'PREDICTION_MARKET' || mapping.activityGroup === 'SOCIAL')
        .map(mapping => mapping.activityType);

      if (giverTypes.length > 0) {
        const giverActivities = await getUserGiverActivities(userId, limit, offset, giverTypes, dateFilter);
        results.push(...giverActivities);
      }

      if (creatorTypes.length > 0) {
        const creatorActivities = await getUserActivities(userId, limit, offset, creatorTypes, dateFilter, false);
        results.push(...creatorActivities);
      }

      return results
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
    
    // No specific filters, get all activities (giver + content creation)
    const engagementActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED'] as ActivityType[];
    const contentCreationActivityTypes = ['REVIEW_CREATED', 'DISCUSSION_CREATED', 'WATCHLIST_CREATED', 'PREDICTION_CREATED'] as ActivityType[];
    
    const engagementActivities = await getUserGiverActivities(userId, limit, offset, engagementActivityTypes, dateFilter);
    const contentCreationActivities = await getUserActivities(userId, limit, offset, contentCreationActivityTypes, dateFilter, false);
    
    const filteredContentCreationActivities = contentCreationActivities.filter(activity => 
      activity.giverId === null
    );
    
    const allActivities = [...engagementActivities, ...filteredContentCreationActivities]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return allActivities;
  }

  // Get user's global privacy setting
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { showActivity: true }
  });

  if (!user?.showActivity) {
    return [];
  }

  // Get privacy settings for activity groups
  const privacySettings = await getUserActivityPrivacy(userId);
  const privateGroups = privacySettings
    .filter(setting => !setting.isPublic)
    .map(setting => setting.activityGroup);

  // If filtering by activity groups, exclude private ones
  if (activityGroups && activityGroups.length > 0) {
    const publicGroups = activityGroups.filter(group => !privateGroups.includes(group));
    if (publicGroups.length === 0) {
      return [];
    }
    
    // Separate groups by query type
    const engagementGroups = publicGroups.filter(group => 
      group === 'ENGAGEMENT' || group === 'DISENGAGEMENT'
    );
    const nonEngagementGroups = publicGroups.filter(group => 
      group === 'CONTENT_CREATION' || group === 'PREDICTION_MARKET' || group === 'SOCIAL'
    );
    
    const results = [];
    
    // Get ENGAGEMENT activities where user was the giver (giverId = targetUserId)
    if (engagementGroups.length > 0) {
      const engagementTypes = await prisma.activityGroupMapping.findMany({
        where: { activityGroup: { in: engagementGroups } },
        select: { activityType: true }
      });
      
      const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
      const engagementActivities = await getUserGiverActivities(userId, limit, offset, engagementActivityTypes, dateFilter);
      results.push(...engagementActivities);
    }
    
    // Get non-ENGAGEMENT activities where user was the creator (userId = targetUserId)
    if (nonEngagementGroups.length > 0) {
      const nonEngagementTypes = await prisma.activityGroupMapping.findMany({
        where: { activityGroup: { in: nonEngagementGroups } },
        select: { activityType: true }
      });
      
      const nonEngagementActivityTypes = nonEngagementTypes.map(mapping => mapping.activityType);
      const nonEngagementActivities = await getUserActivities(userId, limit, offset, nonEngagementActivityTypes, dateFilter, false);
      results.push(...nonEngagementActivities);
    }
    
    // Sort by creation date and limit results
    return results
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // If filtering by activity types, we need to check which groups they belong to
  if (activityTypes && activityTypes.length > 0) {
    const groupMappings = await prisma.activityGroupMapping.findMany({
      where: {
        activityType: { in: activityTypes }
      },
      select: {
        activityType: true,
        activityGroup: true
      }
    });

    // Filter out activity types from private groups
    const publicMappings = groupMappings.filter(mapping => 
      !privateGroups.includes(mapping.activityGroup)
    );

    if (publicMappings.length === 0) {
      return [];
    }

    const results = [];
    
    // Separate by group type
    const giverTypes = publicMappings
      .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT')
      .map(mapping => mapping.activityType);
    
    const creatorTypes = publicMappings
      .filter(mapping => mapping.activityGroup === 'CONTENT_CREATION' || mapping.activityGroup === 'PREDICTION_MARKET' || mapping.activityGroup === 'SOCIAL')
      .map(mapping => mapping.activityType);

    // Get giver activities
    if (giverTypes.length > 0) {
      const giverActivities = await getUserGiverActivities(userId, limit, offset, giverTypes, dateFilter);
      results.push(...giverActivities);
    }

    // Get creator activities
    if (creatorTypes.length > 0) {
      const creatorActivities = await getUserActivities(userId, limit, offset, creatorTypes, dateFilter, false);
      results.push(...creatorActivities);
    }

    // Sort by creation date and limit results
    return results
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // No specific filters, get all public activities respecting privacy settings
  // When viewing someone else's profile, show what they did (giver + content creation)
  
  // Get all activity types and filter by privacy settings
  const allActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED', 'REVIEW_CREATED', 'DISCUSSION_CREATED', 'WATCHLIST_CREATED', 'PREDICTION_CREATED'] as ActivityType[];
  
  // Get group mappings for all activity types
  const groupMappings = await prisma.activityGroupMapping.findMany({
    where: {
      activityType: { in: allActivityTypes }
    },
    select: {
      activityType: true,
      activityGroup: true
    }
  });

  // Filter out activity types from private groups
  const publicMappings = groupMappings.filter(mapping => 
    !privateGroups.includes(mapping.activityGroup)
  );

  if (publicMappings.length === 0) {
    return [];
  }

  const results = [];
  
  // Separate by group type
  const giverTypes = publicMappings
    .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT')
    .map(mapping => mapping.activityType);
  
  const creatorTypes = publicMappings
    .filter(mapping => mapping.activityGroup === 'CONTENT_CREATION' || mapping.activityGroup === 'PREDICTION_MARKET' || mapping.activityGroup === 'SOCIAL')
    .map(mapping => mapping.activityType);

  // Get giver activities
  if (giverTypes.length > 0) {
    const giverActivities = await getUserGiverActivities(userId, limit, offset, giverTypes, dateFilter);
    results.push(...giverActivities);
  }

  // Get creator activities
  if (creatorTypes.length > 0) {
    const creatorActivities = await getUserActivities(userId, limit, offset, creatorTypes, dateFilter, false);
    results.push(...creatorActivities);
  }

  // Sort by creation date and limit results
  return results
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// Helper function to get activity statistics
export async function getUserActivityStats(userId: string, viewerId?: string) {
  // Get total activity count
  const totalActivities = await prisma.userActivity.count({
    where: {
      userId,
      isPublic: viewerId === userId ? undefined : true
    }
  });
  console.log('totalActivities', totalActivities);

  // Get activities by type
  const activitiesByType = await prisma.userActivity.groupBy({
    by: ['activityType'],
    where: {
      userId,
      isPublic: viewerId === userId ? undefined : true
    },
    _count: {
      activityType: true
    }
  });
  console.log('activitiesByType', activitiesByType);
  // Get activities by month (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const activitiesByMonth = await prisma.userActivity.groupBy({
    by: ['createdAt'],
    where: {
      userId,
      isPublic: viewerId === userId ? undefined : true,
      createdAt: {
        gte: twelveMonthsAgo
      }
    },
    _count: {
      createdAt: true
    }
  });
  console.log('activitiesByMonth', activitiesByMonth);
  return {
    totalActivities,
    activitiesByType,
    activitiesByMonth
  };
}
