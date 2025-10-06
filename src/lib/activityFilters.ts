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
): Promise<{ activities: unknown[], userShowActivity: boolean }> {
  // Import the getUserActivities, getUserGiverActivities, and getUserReceiverActivities functions from activityTracker
  const { getUserActivities, getUserGiverActivities, getUserReceiverActivities } = await import('./activityTracker');

  // Get user's global privacy setting
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { showActivity: true }
  });

  const userShowActivity = user?.showActivity ?? false;

  // Get privacy settings for all users (needed for filtering)
  const privacySettings = await getUserActivityPrivacy(userId);
  const privateGroups = privacySettings
    .filter(setting => !setting.isPublic)
    .map(setting => setting.activityGroup);

  // If viewing own activities, handle different filter modes
  if (viewerId === userId) {
    
    // Create a mapping of activity types to their groups
    const groupMappings = await prisma.activityGroupMapping.findMany({
      select: {
        activityType: true,
        activityGroup: true
      }
    });
    
    const activityTypeToGroup = new Map(
      groupMappings.map(mapping => [mapping.activityType, mapping.activityGroup])
    );
    
    // Handle "you" filter mode - show what the user did (giver activities + content creation)
    if (filterMode === 'you') {
      // Use the same logic as viewing someone else's profile, but for giver activities
      if (activityGroups && activityGroups.length > 0) {
        const results = [];
        
        // Separate groups by query type
        const engagementGroups = activityGroups.filter(group => 
          group === 'ENGAGEMENT' || group === 'DISENGAGEMENT'
        );
        const socialGroups = activityGroups.filter(group => 
          group === 'SOCIAL'
        );
        const nonEngagementGroups = activityGroups.filter(group => 
          group === 'CONTENT_CREATION' || group === 'PREDICTION_MARKET'
        );
        
        // Get ENGAGEMENT activities where user was the giver
        if (engagementGroups.length > 0) {
          const engagementTypes = await prisma.activityGroupMapping.findMany({
            where: { activityGroup: { in: engagementGroups } },
            select: { activityType: true }
          });
          
          const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
          const engagementActivities = await getUserGiverActivities(userId, 1000, 0, engagementActivityTypes, dateFilter);
          
          // Add group privacy information to each activity
          const activitiesWithPrivacy = engagementActivities.map(activity => ({
            ...activity,
            isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
          }));
          
          results.push(...activitiesWithPrivacy);
        }
        
        // Get SOCIAL activities where user was the giver
        if (socialGroups.length > 0) {
          const socialTypes = await prisma.activityGroupMapping.findMany({
            where: { activityGroup: { in: socialGroups } },
            select: { activityType: true }
          });
          
          const socialActivityTypes = socialTypes.map(mapping => mapping.activityType);
          const socialActivities = await getUserGiverActivities(userId, 1000, 0, socialActivityTypes, dateFilter);
          
          // Add group privacy information to each activity
          const activitiesWithPrivacy = socialActivities.map(activity => ({
            ...activity,
            isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
          }));
          
          results.push(...activitiesWithPrivacy);
        }
        
        // Get non-ENGAGEMENT activities where user was the creator
        if (nonEngagementGroups.length > 0) {
          const nonEngagementTypes = await prisma.activityGroupMapping.findMany({
            where: { activityGroup: { in: nonEngagementGroups } },
            select: { activityType: true }
          });
          
          const nonEngagementActivityTypes = nonEngagementTypes.map(mapping => mapping.activityType);
          const nonEngagementActivities = await getUserActivities(userId, 1000, 0, nonEngagementActivityTypes, dateFilter, true); // includePrivate = true
          
          // Add group privacy information to each activity
          const activitiesWithPrivacy = nonEngagementActivities.map(activity => ({
            ...activity,
            isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
          }));
          
          results.push(...activitiesWithPrivacy);
        }
        
        // Sort by creation date and apply offset/limit
        return {
          activities: results
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(offset, offset + limit),
          userShowActivity
        };
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
          const giverActivities = await getUserGiverActivities(userId, 1000, 0, giverTypes, dateFilter);
          
          // Add group privacy information to each activity
          const activitiesWithPrivacy = giverActivities.map(activity => ({
            ...activity,
            isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
          }));
          
          results.push(...activitiesWithPrivacy);
        }

        // Get creator activities
        if (creatorTypes.length > 0) {
          const creatorActivities = await getUserActivities(userId, 1000, 0, creatorTypes, dateFilter, true); // includePrivate = true
          
          // Add group privacy information to each activity
          const activitiesWithPrivacy = creatorActivities.map(activity => ({
            ...activity,
            isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
          }));
          
          results.push(...activitiesWithPrivacy);
        }

        // Sort by creation date and apply offset/limit
        return {
          activities: results
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(offset, offset + limit),
          userShowActivity
        };
      }
      
      // No specific filters, get all activities (giver + content creation)
      const engagementActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED'] as ActivityType[];
      const contentCreationActivityTypes = ['REVIEW_CREATED', 'DISCUSSION_CREATED', 'WATCHLIST_CREATED', 'PREDICTION_CREATED'] as ActivityType[];
      
      const engagementActivities = await getUserGiverActivities(userId, 1000, 0, engagementActivityTypes, dateFilter);
      const contentCreationActivities = await getUserActivities(userId, 1000, 0, contentCreationActivityTypes, dateFilter, true); // includePrivate = true
      
      const filteredContentCreationActivities = contentCreationActivities.filter(activity => 
        activity.giverId === null
      );
      
      // Add group privacy information to each activity
      const engagementActivitiesWithPrivacy = engagementActivities.map(activity => ({
        ...activity,
        isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
      }));
      
      const contentCreationActivitiesWithPrivacy = filteredContentCreationActivities.map(activity => ({
        ...activity,
        isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
      }));
      
      const allActivities = [...engagementActivitiesWithPrivacy, ...contentCreationActivitiesWithPrivacy]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);
      
      return {
        activities: allActivities,
        userShowActivity
      };
    }
    
    // Handle "incoming" filter mode - show what the user received
    if (filterMode === 'incoming') {
      if (activityGroups && activityGroups.length > 0) {
        const engagementGroups = activityGroups.filter(group => 
          group === 'ENGAGEMENT' || group === 'DISENGAGEMENT' || group === 'SOCIAL'
        );
        
        if (engagementGroups.length > 0) {
          const engagementTypes = await prisma.activityGroupMapping.findMany({
            where: { activityGroup: { in: engagementGroups } },
            select: { activityType: true }
          });
          
          const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
          const receiverActivities = await getUserReceiverActivities(userId, 1000, 0, engagementActivityTypes, dateFilter);
          
          // Add group privacy information to each activity
          const activitiesWithPrivacy = receiverActivities.map(activity => ({
            ...activity,
            isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
          }));
          
          return {
            activities: activitiesWithPrivacy
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(offset, offset + limit),
            userShowActivity
          };
        }
        
        return {
          activities: [],
          userShowActivity
        };
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
          .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT' || mapping.activityGroup === 'SOCIAL')
          .map(mapping => mapping.activityType);
        
        if (giverTypes.length > 0) {
          const receiverActivities = await getUserReceiverActivities(userId, 1000, 0, giverTypes, dateFilter);
          
          // Add group privacy information to each activity
          const activitiesWithPrivacy = receiverActivities.map(activity => ({
            ...activity,
            isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
          }));
          
          return {
            activities: activitiesWithPrivacy
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(offset, offset + limit),
            userShowActivity
          };
        }
        
        return {
          activities: [],
          userShowActivity
        };
      }
      
      // No specific filters, get all receiver activities
      const engagementActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED'] as ActivityType[];
      const receiverActivities = await getUserReceiverActivities(userId, 1000, 0, engagementActivityTypes, dateFilter);
      
      // Add group privacy information to each activity
      const activitiesWithPrivacy = receiverActivities.map(activity => ({
        ...activity,
        isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
      }));
      
      return {
        activities: activitiesWithPrivacy
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(offset, offset + limit),
        userShowActivity
      };
    }
    
    // Default "you" mode - show what they did (giver activities + content creation)
    // Use the same logic as "you" mode above
    if (activityGroups && activityGroups.length > 0) {
      const results = [];
      
      const engagementGroups = activityGroups.filter(group => 
        group === 'ENGAGEMENT' || group === 'DISENGAGEMENT'
      );
      const socialGroups = activityGroups.filter(group => 
        group === 'SOCIAL'
      );
      const nonEngagementGroups = activityGroups.filter(group => 
        group === 'CONTENT_CREATION' || group === 'PREDICTION_MARKET'
      );
      
      if (engagementGroups.length > 0) {
        const engagementTypes = await prisma.activityGroupMapping.findMany({
          where: { activityGroup: { in: engagementGroups } },
          select: { activityType: true }
        });
        
        const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
        const engagementActivities = await getUserGiverActivities(userId, 1000, 0, engagementActivityTypes, dateFilter);
        
        // Add group privacy information to each activity
        const activitiesWithPrivacy = engagementActivities.map(activity => ({
          ...activity,
          isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
        }));
        
        results.push(...activitiesWithPrivacy);
      }
      
      if (socialGroups.length > 0) {
        const socialTypes = await prisma.activityGroupMapping.findMany({
          where: { activityGroup: { in: socialGroups } },
          select: { activityType: true }
        });
        
        const socialActivityTypes = socialTypes.map(mapping => mapping.activityType);
        const socialActivities = await getUserGiverActivities(userId, 1000, 0, socialActivityTypes, dateFilter);
        
        // Add group privacy information to each activity
        const activitiesWithPrivacy = socialActivities.map(activity => ({
          ...activity,
          isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
        }));
        
        results.push(...activitiesWithPrivacy);
      }
      
      if (nonEngagementGroups.length > 0) {
        const nonEngagementTypes = await prisma.activityGroupMapping.findMany({
          where: { activityGroup: { in: nonEngagementGroups } },
          select: { activityType: true }
        });
        
        const nonEngagementActivityTypes = nonEngagementTypes.map(mapping => mapping.activityType);
        const nonEngagementActivities = await getUserActivities(userId, 1000, 0, nonEngagementActivityTypes, dateFilter, true); // includePrivate = true
        
        // Add group privacy information to each activity
        const activitiesWithPrivacy = nonEngagementActivities.map(activity => ({
          ...activity,
          isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
        }));
        
        results.push(...activitiesWithPrivacy);
      }
      
      return {
        activities: results
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(offset, offset + limit),
        userShowActivity
      };
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
        .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT' || mapping.activityGroup === 'SOCIAL')
        .map(mapping => mapping.activityType);
      
      const creatorTypes = groupMappings
        .filter(mapping => mapping.activityGroup === 'CONTENT_CREATION' || mapping.activityGroup === 'PREDICTION_MARKET')
        .map(mapping => mapping.activityType);

      if (giverTypes.length > 0) {
        const giverActivities = await getUserGiverActivities(userId, 1000, 0, giverTypes, dateFilter);
        
        // Add group privacy information to each activity
        const activitiesWithPrivacy = giverActivities.map(activity => ({
          ...activity,
          isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
        }));
        
        results.push(...activitiesWithPrivacy);
      }

      if (creatorTypes.length > 0) {
        const creatorActivities = await getUserActivities(userId, 1000, 0, creatorTypes, dateFilter, true); // includePrivate = true
        
        // Add group privacy information to each activity
        const activitiesWithPrivacy = creatorActivities.map(activity => ({
          ...activity,
          isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
        }));
        
        results.push(...activitiesWithPrivacy);
      }

      return {
        activities: results
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(offset, offset + limit),
        userShowActivity
      };
    }
    
    // No specific filters, get all activities (giver + content creation)
    const engagementActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED'] as ActivityType[];
    const contentCreationActivityTypes = ['REVIEW_CREATED', 'DISCUSSION_CREATED', 'WATCHLIST_CREATED', 'PREDICTION_CREATED'] as ActivityType[];
    
    const engagementActivities = await getUserGiverActivities(userId, 1000, 0, engagementActivityTypes, dateFilter);
    const contentCreationActivities = await getUserActivities(userId, 1000, 0, contentCreationActivityTypes, dateFilter, true); // includePrivate = true
    
    const filteredContentCreationActivities = contentCreationActivities.filter(activity => 
      activity.giverId === null
    );
    
    // Add group privacy information to each activity
    const engagementActivitiesWithPrivacy = engagementActivities.map(activity => ({
      ...activity,
      isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
    }));
    
    const contentCreationActivitiesWithPrivacy = filteredContentCreationActivities.map(activity => ({
      ...activity,
      isGroupPrivate: privateGroups.includes(activityTypeToGroup.get(activity.activityType) as ActivityGroup)
    }));
    
    const allActivities = [...engagementActivitiesWithPrivacy, ...contentCreationActivitiesWithPrivacy]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    
    return {
      activities: allActivities,
      userShowActivity
    };
  }

  if (!userShowActivity) {
    return {
      activities: [],
      userShowActivity
    };
  }

  // Privacy settings already defined above

  // If filtering by activity groups, exclude private ones
  if (activityGroups && activityGroups.length > 0) {
    const publicGroups = activityGroups.filter(group => !privateGroups.includes(group));
    if (publicGroups.length === 0) {
      return {
        activities: [],
        userShowActivity
      };
    }
    
    // Separate groups by query type
    const engagementGroups = publicGroups.filter(group => 
      group === 'ENGAGEMENT' || group === 'DISENGAGEMENT' || group === 'SOCIAL'
    );
    const nonEngagementGroups = publicGroups.filter(group => 
      group === 'CONTENT_CREATION' || group === 'PREDICTION_MARKET'
    );
    
    const results = [];
    
    // Get ENGAGEMENT activities where user was the giver (giverId = targetUserId)
    if (engagementGroups.length > 0) {
      const engagementTypes = await prisma.activityGroupMapping.findMany({
        where: { activityGroup: { in: engagementGroups } },
        select: { activityType: true }
      });
      
      const engagementActivityTypes = engagementTypes.map(mapping => mapping.activityType);
      const engagementActivities = await getUserGiverActivities(userId, 1000, 0, engagementActivityTypes, dateFilter);
      results.push(...engagementActivities);
    }
    
    // Get non-ENGAGEMENT activities where user was the creator (userId = targetUserId)
    if (nonEngagementGroups.length > 0) {
      const nonEngagementTypes = await prisma.activityGroupMapping.findMany({
        where: { activityGroup: { in: nonEngagementGroups } },
        select: { activityType: true }
      });
      
      const nonEngagementActivityTypes = nonEngagementTypes.map(mapping => mapping.activityType);
      const nonEngagementActivities = await getUserActivities(userId, 1000, 0, nonEngagementActivityTypes, dateFilter, false);
      results.push(...nonEngagementActivities);
    }
    
    // Sort by creation date and apply offset/limit
    return {
      activities: results
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit),
      userShowActivity
    };
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
      return {
        activities: [],
        userShowActivity
      };
    }

    const results = [];
    
    // Separate by group type
  const giverTypes = publicMappings
    .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT' || mapping.activityGroup === 'SOCIAL')
    .map(mapping => mapping.activityType);
    
    const creatorTypes = publicMappings
      .filter(mapping => mapping.activityGroup === 'CONTENT_CREATION' || mapping.activityGroup === 'PREDICTION_MARKET')
      .map(mapping => mapping.activityType);

    // Get giver activities
    if (giverTypes.length > 0) {
      const giverActivities = await getUserGiverActivities(userId, 1000, 0, giverTypes, dateFilter);
      results.push(...giverActivities);
    }

    // Get creator activities
    if (creatorTypes.length > 0) {
      const creatorActivities = await getUserActivities(userId, 1000, 0, creatorTypes, dateFilter, false);
      results.push(...creatorActivities);
    }

    // Sort by creation date and apply offset/limit
    return {
      activities: results
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit),
      userShowActivity
    };
  }

  // Skip "no specific filters" section if activityGroups are provided (already handled above)
  if (activityGroups && activityGroups.length > 0) {
    return {
      activities: [],
      userShowActivity
    };
  }

  // No specific filters, get all public activities respecting privacy settings
  // When viewing someone else's profile, show what they did (giver + content creation)
  // When viewing own profile, respect filterMode (you vs incoming)
  
  // Get all activity types and filter by privacy settings
  const allActivityTypes = ['REVIEW_LIKED', 'REVIEW_UNLIKED', 'DISCUSSION_LIKED', 'DISCUSSION_UNLIKED', 'WATCHLIST_LIKED', 'WATCHLIST_UNLIKED', 'PREDICTION_LIKED', 'PREDICTION_UNLIKED', 'COMMENT_UPVOTED', 'COMMENT_DOWNVOTED', 'COMMENT_CREATED', 'REVIEW_CREATED', 'DISCUSSION_CREATED', 'WATCHLIST_CREATED', 'PREDICTION_CREATED', 'USER_FOLLOWED', 'USER_UNFOLLOWED'] as ActivityType[];
  
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
    return {
      activities: [],
      userShowActivity
    };
  }

  const results = [];
  
  // Separate by group type
  const giverTypes = publicMappings
    .filter(mapping => mapping.activityGroup === 'ENGAGEMENT' || mapping.activityGroup === 'DISENGAGEMENT' || mapping.activityGroup === 'SOCIAL')
    .map(mapping => mapping.activityType);
    
  const creatorTypes = publicMappings
    .filter(mapping => mapping.activityGroup === 'CONTENT_CREATION' || mapping.activityGroup === 'PREDICTION_MARKET')
    .map(mapping => mapping.activityType);

  // For incoming mode, get receiver activities instead of giver activities
  if (filterMode === 'incoming') {
    // Get receiver activities (where user received something)
    if (giverTypes.length > 0) {
      const receiverActivities = await getUserReceiverActivities(userId, 1000, 0, giverTypes, dateFilter);
      results.push(...receiverActivities);
    }
  } else {
    // Get giver activities (where user did something)
    if (giverTypes.length > 0) {
      const giverActivities = await getUserGiverActivities(userId, 1000, 0, giverTypes, dateFilter);
      results.push(...giverActivities);
    }
  }

  // Get creator activities (always the same regardless of filter mode)
  if (creatorTypes.length > 0) {
    const creatorActivities = await getUserActivities(userId, 1000, 0, creatorTypes, dateFilter, false);
    results.push(...creatorActivities);
  }

  // Sort by creation date and apply offset/limit
  return {
    activities: results
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit),
    userShowActivity
  };
}

