import { NextResponse } from 'next/server';
import prisma from '@/lib/client';

export async function GET() {
  try {
    // Get all activity groups with their mappings
    const activityGroups = await prisma.activityGroupMapping.findMany({
      select: {
        activityGroup: true,
        activityType: true
      },
      orderBy: [
        { activityGroup: 'asc' },
        { activityType: 'asc' }
      ]
    });

    // Group by activity group
    const groupedActivities = activityGroups.reduce((acc, mapping) => {
      if (!acc[mapping.activityGroup]) {
        acc[mapping.activityGroup] = [];
      }
      acc[mapping.activityGroup].push(mapping.activityType);
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json({
      activityGroups: Object.keys(groupedActivities),
      activityTypes: Object.values(groupedActivities).flat(),
      mappings: groupedActivities
    });

  } catch (error) {
    console.error('Error fetching activity groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity groups' },
      { status: 500 }
    );
  }
}
