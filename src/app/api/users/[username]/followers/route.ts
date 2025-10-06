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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Find target user by username
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get followers of the target user
    const followers = await prisma.userFollow.findMany({
      where: { followingId: targetUser.id },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Check which of these followers the current user is also following
    const followerIds = followers.map(f => f.follower.id);
    const currentUserFollowing = await prisma.userFollow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(currentUserFollowing.map(f => f.followingId));

    const followersWithStatus = followers.map(follow => ({
      id: follow.id,
      user: follow.follower,
      createdAt: follow.createdAt,
      isFollowing: followingSet.has(follow.follower.id),
    }));

    return NextResponse.json({
      followers: followersWithStatus,
      total: followers.length,
      hasMore: followers.length === limit,
    });

  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
