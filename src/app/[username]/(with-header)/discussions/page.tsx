import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import UserDiscussionsClient from "@/components/UserDiscussionsClient";

interface UserDiscussionsPageProps {
    params: Promise<{ username: string }>;
}

export default async function UserDiscussionsPage({
    params,
}: UserDiscussionsPageProps) {
    const { username } = await params;
    const { userId: currentUserId } = await auth();

    // Fetch user data (minimal check to ensure user exists)
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
        },
    });

    if (!user) {
        notFound();
    }

    const isOwnProfile = currentUserId === user.id;

    return (
        <div className="px-4 py-8">
            <UserDiscussionsClient username={username} isOwnProfile={isOwnProfile} />
        </div>
    );
}

export async function generateMetadata({ params }: UserDiscussionsPageProps) {
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
        title: `Discussions by ${user.username}`,
        description: `View all discussions by ${user.username} on Reality Punch`,
    };
}

