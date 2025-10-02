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
    const { username } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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

    // Get all activity groups with their current privacy settings
    const allActivityGroups = await prisma.activityGroupMapping.findMany({
      select: {
        activityGroup: true
      },
      distinct: ['activityGroup']
    });

    const currentPrivacySettings = await prisma.userActivityPrivacy.findMany({
      where: { userId: targetUserId },
      select: {
        activityGroup: true,
        isPublic: true
      }
    });

    // Create a map of current settings
    const privacyMap = new Map(
      currentPrivacySettings.map(setting => [setting.activityGroup, setting.isPublic])
    );

    // Return all groups with their privacy settings (default to true if not set)
    const groupsWithPrivacy = allActivityGroups.map(item => ({
      activityGroup: item.activityGroup,
      isPublic: privacyMap.get(item.activityGroup) ?? true
    }));

    return NextResponse.json({
      groups: groupsWithPrivacy
    });

  } catch (error) {
    console.error('Error fetching group privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group privacy settings' },
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
    const { username } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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
    const { activityGroup, isPublic } = body;

    if (!activityGroup || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body. Required: activityGroup (string), isPublic (boolean)' },
        { status: 400 }
      );
    }

    // Update or create the privacy setting for this activity group
    await prisma.userActivityPrivacy.upsert({
      where: {
        userId_activityGroup: {
          userId: targetUserId,
          activityGroup: activityGroup as ActivityGroup
        }
      },
      update: {
        isPublic: isPublic
      },
      create: {
        userId: targetUserId,
        activityGroup: activityGroup as ActivityGroup,
        isPublic: isPublic
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Privacy setting updated for ${activityGroup}`
    });

  } catch (error) {
    console.error('Error updating group privacy setting:', error);
    return NextResponse.json(
      { error: 'Failed to update group privacy setting' },
      { status: 500 }
    );
  }
}
