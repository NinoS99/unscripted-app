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

    // Get users that the target user is following
    const following = await prisma.userFollow.findMany({
      where: { followerId: targetUser.id },
      include: {
        following: {
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

    // Check which of these users the current user is also following
    const followingIds = following.map(f => f.following.id);
    const currentUserFollowing = await prisma.userFollow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followingIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(currentUserFollowing.map(f => f.followingId));

    const followingWithStatus = following.map(follow => ({
      id: follow.id,
      user: follow.following,
      createdAt: follow.createdAt,
      isFollowing: followingSet.has(follow.following.id),
    }));

    return NextResponse.json({
      following: followingWithStatus,
      total: following.length,
      hasMore: following.length === limit,
    });

  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
