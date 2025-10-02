import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/client';
import { ActivityGroup } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { username } = await params;
    
    // Get user ID from username
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUser.id;

    // Only allow users to view their own privacy settings
    if (userId !== targetUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get user's global privacy setting
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { showActivity: true }
    });

    // Get user's activity group privacy settings
    const groupPrivacySettings = await prisma.userActivityPrivacy.findMany({
      where: { userId: targetUserId },
      select: {
        activityGroup: true,
        isPublic: true
      }
    });

    // Get all available activity groups
    const allActivityGroups = await prisma.activityGroupMapping.findMany({
      select: {
        activityGroup: true
      },
      distinct: ['activityGroup']
    });

    const availableGroups = allActivityGroups.map(item => item.activityGroup);

    // Create a map of current settings (default to public if not set)
    const privacyMap = new Map(
      groupPrivacySettings.map(setting => [setting.activityGroup, setting.isPublic])
    );

    // Return all groups with their privacy settings (default to public if not set)
    const groupsWithPrivacy = availableGroups.map(activityGroup => ({
      activityGroup,
      isPublic: privacyMap.get(activityGroup) ?? true // Default to public if not set
    }));

    return NextResponse.json({
      globalPrivacy: user?.showActivity ?? true,
      groupPrivacy: groupsWithPrivacy,
      availableGroups
    });

  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { username } = await params;
    
    // Get user ID from username
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUser.id;

    // Only allow users to update their own privacy settings
    if (userId !== targetUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { globalPrivacy, groupPrivacy } = body;

    // Update global privacy setting (showActivity)
    if (globalPrivacy !== undefined) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { showActivity: globalPrivacy }
      });
    }

    // Update group privacy settings
    if (groupPrivacy && Array.isArray(groupPrivacy)) {
      for (const setting of groupPrivacy) {
        await prisma.userActivityPrivacy.upsert({
          where: {
            userId_activityGroup: {
              userId: targetUserId,
              activityGroup: setting.activityGroup as ActivityGroup
            }
          },
          update: {
            isPublic: setting.isPublic
          },
          create: {
            userId: targetUserId,
            activityGroup: setting.activityGroup as ActivityGroup,
            isPublic: setting.isPublic
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Privacy settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
