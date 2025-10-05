import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserActivitiesWithPrivacy } from '@/lib/activityFilters';
import { ActivityType, ActivityGroup } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId } = await auth();
    const { username } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // The username parameter is actually the userId (Clerk ID)
    const targetUserId = username;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityTypes = searchParams.get('activityTypes')?.split(',') as ActivityType[];
    const activityGroups = searchParams.get('activityGroups')?.split(',') as ActivityGroup[];
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const day = searchParams.get('day') ? parseInt(searchParams.get('day')!) : undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const filterMode = searchParams.get('filterMode') as 'you' | 'incoming' || 'you';

    // Build date filter
    const dateFilter = year || month || day || startDate || endDate ? {
      year,
      month,
      day,
      startDate,
      endDate
    } : undefined;

    // Get activities with privacy settings
    const { activities, userShowActivity } = await getUserActivitiesWithPrivacy(
      targetUserId,
      userId, // viewerId
      limit,
      offset,
      activityTypes,
      activityGroups,
      dateFilter,
      filterMode
    );

    // Get total count for pagination - get one extra to check if there are more
    const { activities: allActivities } = await getUserActivitiesWithPrivacy(
      targetUserId,
      userId, // viewerId
      1000, // Large limit to get all activities
      0,
      activityTypes,
      activityGroups,
      dateFilter,
      filterMode
    );
    const totalCount = allActivities.length;

    // Calculate hasMore based on total count vs current offset
    const hasMore = offset + activities.length < totalCount;

    return NextResponse.json({
      activities,
      totalCount,
      userShowActivity,
      pagination: {
        limit,
        offset,
        hasMore
      }
    });

  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activities' },
      { status: 500 }
    );
  }
}
