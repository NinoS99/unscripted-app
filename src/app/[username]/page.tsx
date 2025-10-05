import { notFound } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import UserProfileHeader from "@/components/UserProfileHeader";
import UserStats from "@/components/UserStats";
import UserActivityFeed from "@/components/UserActivityFeed";
import UserContent from "@/components/UserContent";
import UserShowcase from "@/components/UserShowcase";

interface UserProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function UserProfilePage({
    params,
}: UserProfilePageProps) {
    const { username } = await params;
    const { userId: currentUserId } = await auth();

    // Fetch user data
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            bio: true,
            twitter: true,
            instagram: true,
            showActivity: true,
            createdAt: true,
            points: {
                select: {
                    balance: true,
                },
            },
            topFourShows: {
                orderBy: { position: "asc" },
                include: {
                    show: {
                        select: {
                            id: true,
                            name: true,
                            posterPath: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        notFound();
    }

    const isOwnProfile = currentUserId === user.id;

    // Get profile image from Clerk for the profile owner
    let profileImageUrl = "/noAvatar.png";
    try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(user.id);
        profileImageUrl = clerkUser?.imageUrl || "/noAvatar.png";
    } catch (error) {
        console.error(`Failed to fetch Clerk user for ${user.id}:`, error);
        profileImageUrl = "/noAvatar.png";
    }

    return (
        <div className="min-h-screen bg-gray-900 container mx-auto">
            {/* Profile Header */}
            <UserProfileHeader
                user={{
                    ...user,
                    imageUrl: profileImageUrl,
                    starPoints: user.points?.balance || 0,
                    topFourShows: user.topFourShows.map((tfs) => tfs.show),
                }}
                isOwnProfile={isOwnProfile}
            />

            <div className="container mx-auto px-2 py-2 md:px-8 md:py-8 bg-gray-900">
                {/* Mobile Layout - Single Column */}
                <div className="flex flex-col md:hidden gap-6">
                    <div className="px-6 pt-2">
                        {/* User Stats */}
                        <UserStats userId={user.id} />
                    </div>

                    <div className="px-6">
                        {/* Content */}
                        <UserContent
                            userId={user.id}
                            username={user.username}
                        />
                    </div>
                    
                    <div className="px-6">
                        {/* Activity Feed */}
                        <UserActivityFeed
                            userId={user.id}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>
                </div>

                {/* Desktop Layout - Two Columns */}
                <div className="hidden md:flex flex-row gap-8">
                    {/* Left Column - Stats */}
                    <div className="flex-shrink-0 w-64">
                        <div className="p-0">
                            {/* User Stats */}
                            <UserStats userId={user.id} />
                        </div>
                    </div>

                    {/* Right Column - Showcase, Activity Feed and Content */}
                    <div className="flex-1 p-0">
                        {/* User Showcase */}
                        <UserShowcase
                            username={user.username}
                            topFourShows={user.topFourShows.map(
                                (tfs) => tfs.show
                            )}
                            isOwnProfile={isOwnProfile}
                        />

                        {/* Content */}
                        <div className="mt-8">
                            <UserContent
                                userId={user.id}
                                username={user.username}
                            />
                        </div>

                        {/* Activity Feed */}
                        <div className="mt-8">
                            <UserActivityFeed
                                userId={user.id}
                                isOwnProfile={isOwnProfile}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: UserProfilePageProps) {
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

    const displayName = user.username;

    return {
        title: `${displayName} (@${user.username})`,
        description: `View ${displayName}'s profile, reviews, and activity on Reality Punch`,
    };
}
