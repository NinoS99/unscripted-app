import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import UserReviewsClient from "@/components/UserReviewsClient";

interface UserReviewsPageProps {
    params: Promise<{ username: string }>;
}

export default async function UserReviewsPage({
    params,
}: UserReviewsPageProps) {
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
            <UserReviewsClient username={username} isOwnProfile={isOwnProfile} />
        </div>
    );
}

export async function generateMetadata({ params }: UserReviewsPageProps) {
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
        title: `Reviews by ${user.username}`,
        description: `View all reviews by ${user.username} on Reality Punch`,
    };
}

