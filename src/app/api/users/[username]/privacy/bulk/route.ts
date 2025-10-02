import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/client';
import { ActivityGroup } from '@prisma/client';

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

    // Validate request body
    if (globalPrivacy !== undefined && typeof globalPrivacy !== 'boolean') {
      return NextResponse.json(
        { error: 'globalPrivacy must be a boolean' },
        { status: 400 }
      );
    }

    if (groupPrivacy && !Array.isArray(groupPrivacy)) {
      return NextResponse.json(
        { error: 'groupPrivacy must be an array' },
        { status: 400 }
      );
    }

    // Start a transaction to update all settings atomically
    await prisma.$transaction(async (tx) => {
      // Update global privacy setting (showActivity)
      if (globalPrivacy !== undefined) {
        await tx.user.update({
          where: { id: targetUserId },
          data: { showActivity: globalPrivacy }
        });
      }

      // Update group privacy settings
      if (groupPrivacy && Array.isArray(groupPrivacy)) {
        for (const setting of groupPrivacy) {
          if (!setting.activityGroup || typeof setting.isPublic !== 'boolean') {
            throw new Error(`Invalid setting: ${JSON.stringify(setting)}`);
          }

          await tx.userActivityPrivacy.upsert({
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
    });

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
