import { notFound } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import UserProfileHeader from "@/components/UserProfileHeader";

interface UserLayoutProps {
    params: Promise<{ username: string }>;
    children: React.ReactNode;
}

export default async function UserLayoutWithHeader({
    params,
    children,
}: UserLayoutProps) {
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

    // Get profile image from Clerk
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

            {/* Page Content */}
            {children}
        </div>
    );
}

