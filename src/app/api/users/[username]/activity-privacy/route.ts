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

    // Get user's privacy settings
    const privacySettings = await prisma.userActivityPrivacy.findMany({
      where: { userId: targetUserId },
      select: {
        activityGroup: true,
        isPublic: true
      }
    });

    // Get user's global privacy setting
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { showActivity: true }
    });

    return NextResponse.json({
      globalPrivacy: user?.showActivity ?? true,
      groupPrivacy: privacySettings
    });

  } catch (error) {
    console.error('Error fetching activity privacy settings:', error);
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

    // Update global privacy setting
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating activity privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
