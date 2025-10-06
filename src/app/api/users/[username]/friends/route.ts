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

    // Get mutual follows (friends) - users that both follow each other
    const friends = await prisma.userFollow.findMany({
      where: {
        followerId: targetUser.id,
        following: {
          followers: {
            some: {
              followerId: targetUser.id,
            },
          },
        },
      },
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

    // Filter to ensure it's truly mutual (both follow each other)
    const mutualFriends = [];
    for (const friend of friends) {
      const isMutual = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: friend.following.id,
            followingId: targetUser.id,
          },
        },
      });

      if (isMutual) {
        mutualFriends.push({
          id: friend.id,
          user: friend.following,
          createdAt: friend.createdAt,
        });
      }
    }

    return NextResponse.json({
      friends: mutualFriends,
      total: mutualFriends.length,
      hasMore: mutualFriends.length === limit,
    });

  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}
