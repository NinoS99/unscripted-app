import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
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

    // Get users that the target user is following (fetch limit + 1 to check if there are more)
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
      take: limit + 1,
      skip: offset,
    });

    // Check if there are more users
    const hasMore = following.length > limit;
    
    // Only return up to 'limit' users
    const followingToReturn = hasMore ? following.slice(0, limit) : following;

    // Check which of these users the current user is also following
    const followingIds = followingToReturn.map(f => f.following.id);
    const currentUserFollowing = await prisma.userFollow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followingIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(currentUserFollowing.map(f => f.followingId));

    // Fetch Clerk image URLs
    const clerk = await clerkClient();
    const imageUrlPromises = followingToReturn.map(async (follow) => {
      try {
        const clerkUser = await clerk.users.getUser(follow.following.id);
        return { userId: follow.following.id, imageUrl: clerkUser.imageUrl || "/noAvatar.png" };
      } catch (error) {
        console.error(`Failed to fetch Clerk user for ${follow.following.id}:`, error);
        return { userId: follow.following.id, imageUrl: "/noAvatar.png" };
      }
    });

    const imageUrls = await Promise.all(imageUrlPromises);
    const imageUrlMap = new Map(imageUrls.map(item => [item.userId, item.imageUrl]));

    const followingWithStatus = followingToReturn.map(follow => ({
      id: follow.id,
      user: {
        ...follow.following,
        imageUrl: imageUrlMap.get(follow.following.id) || "/noAvatar.png",
      },
      createdAt: follow.createdAt,
      isFollowing: followingSet.has(follow.following.id),
    }));

    return NextResponse.json({
      following: followingWithStatus,
      total: followingToReturn.length,
      hasMore: hasMore,
    });

  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
