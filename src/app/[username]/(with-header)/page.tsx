import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import UserStats from "@/components/UserStats";
import UserTags from "@/components/UserTags";
import UserActivityFeed from "@/components/UserActivityFeed";
import UserContent from "@/components/UserContent";
import UserShowcase from "@/components/UserShowcase";
import UserDiary from "@/components/UserDiary";

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
            showActivity: true,
            createdAt: true,
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

    return (
        <div className="px-2 py-2 md:px-8 md:py-8 bg-gray-900">
            {/* Single Layout - Responsive */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* User Showcase - Mobile only (appears first) */}
                <div className="md:hidden order-1 mt-4">
                    <UserShowcase
                        username={user.username}
                        topFourShows={user.topFourShows.map(
                            (tfs) => tfs.show
                        )}
                        isOwnProfile={isOwnProfile}
                    />
                </div>

                {/* Left Column - Stats, Diary, and Tags (Mobile: Full width, Desktop: Fixed width) */}
                <div className="md:flex-shrink-0 md:w-64 order-2 md:order-none">
                    <div className="px-4 md:px-0 md:space-y-6">
                        <UserStats userId={user.id} />
                        <div className="hidden md:block">
                            <UserDiary username={user.username} accountCreatedAt={user.createdAt} />
                        </div>
                        <UserTags username={user.username} hideOnMobile={true} />
                    </div>
                </div>

                {/* Right Column - Showcase (Desktop only), Activity Feed and Content */}
                <div className="flex-1 order-3 md:order-none">
                    {/* User Showcase - Desktop only */}
                    <div className="hidden md:block">
                        <UserShowcase
                            username={user.username}
                            topFourShows={user.topFourShows.map(
                                (tfs) => tfs.show
                            )}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>

                    {/* Content */}
                    <div className="md:mt-8 px-4 md:px-0">
                        <UserContent
                            userId={user.id}
                            username={user.username}
                        />
                    </div>

                    {/* Watch Diary - Mobile only */}
                    <div className="mt-8 md:hidden px-4 md:px-0">
                        <UserDiary username={user.username} accountCreatedAt={user.createdAt} />
                    </div>

                    {/* Tags - Mobile only */}
                    <div className="mt-8 md:hidden px-4 md:px-0">
                        <UserTags username={user.username} />
                    </div>

                    {/* Activity Feed */}
                    <div className="mt-8 px-4 md:px-0">
                        <UserActivityFeed
                            userId={user.id}
                            isOwnProfile={isOwnProfile}
                        />
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

