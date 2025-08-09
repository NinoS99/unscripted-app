import { auth, clerkClient } from "@clerk/nextjs/server";
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
            bio: true
        }
    });

    if (!user) {
        notFound();
    }

    // Get Clerk user data for profile picture using the user ID
    let profileImageUrl = "/noAvatar.png";
    try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(user.id);
        profileImageUrl = clerkUser.imageUrl;
    } catch (error) {
        console.error("Error fetching Clerk user:", error);
    }

    // Check if current user is viewing their own profile
    const isOwnProfile = userId === user.id;

    // Fetch watch lists based on privacy settings
    const watchLists = await prisma.watchList.findMany({
        where: {
            userId: user.id,
            OR: [
                { isPublic: true },
                // Only show private/friends-only lists if the current user owns them
                ...(userId === user.id ? [
                    { isPublic: false },
                    { friendsOnly: true }
                ] : [])
                // TODO: Implement friends-only logic when friend system is added
                // - Check if current user is friends with the watch list owner
                // - Show friends-only watch lists to friends
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
            user={{
                ...user,
                profilePicture: profileImageUrl
            }}
            watchLists={watchLists}
            isOwnProfile={isOwnProfile}
        />
    );
} 