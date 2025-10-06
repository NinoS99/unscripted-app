import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username: targetUsername } = await params;
    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get("includeCounts") === "true";

    // Find target user by username
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user is following target user
    const isFollowing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    // Check if target user is following current user (mutual follow)
    const isFollowedBy = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUser.id,
          followingId: currentUserId,
        },
      },
    });

    const isMutualFollow = !!(isFollowing && isFollowedBy);

    let response: {
      isFollowing: boolean;
      isFollowedBy: boolean;
      isMutualFollow: boolean;
      followerCount?: number;
      followingCount?: number;
    } = {
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      isMutualFollow,
    };

    // Include follower/following counts if requested
    if (includeCounts) {
      const [followerCount, followingCount] = await Promise.all([
        prisma.userFollow.count({
          where: { followingId: targetUser.id },
        }),
        prisma.userFollow.count({
          where: { followerId: targetUser.id },
        }),
      ]);

      response = {
        ...response,
        followerCount,
        followingCount,
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}
