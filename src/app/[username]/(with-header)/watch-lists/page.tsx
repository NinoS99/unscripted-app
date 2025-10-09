import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/client";
import UserWatchLists from "@/components/UserWatchLists";

interface UserWatchListsPageProps {
    params: Promise<{ username: string }>;
}

export default async function UserWatchListsPage({ params }: UserWatchListsPageProps) {
    const { username } = await params;
    const { userId } = await auth();

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
        }
    });

    if (!user) {
        notFound();
    }

    // Check if current user is viewing their own profile
    const isOwnProfile = userId === user.id;

    // Check if current user is friends with the profile owner
    let isFriend = false;
    if (userId && !isOwnProfile) {
        // Check if current user follows profile owner
        const currentUserFollowsOwner = await prisma.userFollow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: user.id,
                },
            },
        });

        // Check if profile owner follows current user
        const ownerFollowsCurrentUser = await prisma.userFollow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: user.id,
                    followingId: userId,
                },
            },
        });

        // They're friends if both follow each other
        isFriend = !!(currentUserFollowsOwner && ownerFollowsCurrentUser);
    }

    // Fetch watch lists based on privacy settings
    const watchLists = await prisma.watchList.findMany({
        where: {
            userId: user.id,
            OR: [
                { isPublic: true },
                // Show private/friends-only lists if the current user owns them
                ...(userId === user.id ? [
                    { isPublic: false },
                    { friendsOnly: true }
                ] : []),
                // Show friends-only lists if current user is a friend
                ...(isFriend ? [
                    { friendsOnly: true }
                ] : [])
            ]
        },
        include: {
            shows: {
                include: {
                    show: {
                        select: {
                            id: true,
                            name: true,
                            posterPath: true
                        }
                    }
                },
                orderBy: {
                    ranking: "asc"
                }
            },
            tags: {
                include: {
                    tag: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true,
                    comments: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return (
        <UserWatchLists 
            user={user}
            watchLists={watchLists}
            isOwnProfile={isOwnProfile}
        />
    );
}

export async function generateMetadata({ params }: UserWatchListsPageProps) {
    const { username } = await params;

    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            username: true,
        },
    });

    if (!user) {
        return {
            title: "User Not Found",
        };
    }

    return {
        title: `Watch Lists by ${user.username}`,
        description: `View all watch lists created by ${user.username} on Reality Punch`,
    };
}

