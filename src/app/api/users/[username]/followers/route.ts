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

    // Get followers of the target user (fetch limit + 1 to check if there are more)
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
      take: limit + 1,
      skip: offset,
    });

    // Check if there are more followers
    const hasMore = followers.length > limit;
    
    // Only return up to 'limit' followers
    const followersToReturn = hasMore ? followers.slice(0, limit) : followers;

    // Check which of these followers the current user is also following
    const followerIds = followersToReturn.map(f => f.follower.id);
    const currentUserFollowing = await prisma.userFollow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(currentUserFollowing.map(f => f.followingId));

    // Fetch Clerk image URLs
    const clerk = await clerkClient();
    const imageUrlPromises = followersToReturn.map(async (follow) => {
      try {
        const clerkUser = await clerk.users.getUser(follow.follower.id);
        return { userId: follow.follower.id, imageUrl: clerkUser.imageUrl || "/noAvatar.png" };
      } catch (error) {
        console.error(`Failed to fetch Clerk user for ${follow.follower.id}:`, error);
        return { userId: follow.follower.id, imageUrl: "/noAvatar.png" };
      }
    });

    const imageUrls = await Promise.all(imageUrlPromises);
    const imageUrlMap = new Map(imageUrls.map(item => [item.userId, item.imageUrl]));

    const followersWithStatus = followersToReturn.map(follow => ({
      id: follow.id,
      user: {
        ...follow.follower,
        imageUrl: imageUrlMap.get(follow.follower.id) || "/noAvatar.png",
      },
      createdAt: follow.createdAt,
      isFollowing: followingSet.has(follow.follower.id),
    }));

    return NextResponse.json({
      followers: followersWithStatus,
      total: followersToReturn.length,
      hasMore: hasMore,
    });

  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
