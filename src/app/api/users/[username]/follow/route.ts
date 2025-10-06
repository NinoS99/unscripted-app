import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import { trackFollowActivity } from "@/lib/activityTracker";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username: targetUsername } = await params;

    // Find target user by username
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate that user is not trying to follow themselves
    if (currentUserId === targetUser.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create the follow relationship
    const follow = await prisma.userFollow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUser.id,
      },
    });

    // Track activity for the user being followed (receiver gets points)
    await trackFollowActivity(
      currentUserId,
      targetUser.id,
      'USER_FOLLOWED',
      'User followed',
      {
        entityType: 'user',
        entityName: targetUser.username,
        entityId: targetUser.id,
        receiverUsername: targetUser.username,
        receiverUserId: targetUser.id,
      }
    );

    // Check if this creates a mutual follow (friendship)
    const mutualFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUser.id,
          followingId: currentUserId,
        },
      },
    });

    if (mutualFollow) {
      // Both users are now friends - we could add additional logic here if needed
      // For now, the friendship is implicit in the mutual follow relationship
    }

    return NextResponse.json({
      message: "Successfully followed user",
      follow: {
        id: follow.id,
        followerId: follow.followerId,
        followingId: follow.followingId,
        createdAt: follow.createdAt,
      },
      isMutualFollow: !!mutualFollow,
    });

  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username: targetUsername } = await params;

    // Find target user by username
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate that user is not trying to unfollow themselves
    if (currentUserId === targetUser.id) {
      return NextResponse.json(
        { error: "Cannot unfollow yourself" },
        { status: 400 }
      );
    }

    // Check if follow relationship exists
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 }
      );
    }

    // Delete the follow relationship
    await prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    // Track activity for the user being unfollowed
    await trackFollowActivity(
      currentUserId,
      targetUser.id,
      'USER_UNFOLLOWED',
      'User unfollowed',
      {
        entityType: 'user',
        entityName: targetUser.username,
        entityId: targetUser.id,
        receiverUsername: targetUser.username,
        receiverUserId: targetUser.id,
      }
    );

    return NextResponse.json({
      message: "Successfully unfollowed user",
    });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
