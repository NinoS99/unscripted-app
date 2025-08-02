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
            profilePicture: true,
            bio: true
        }
    });

    if (!user) {
        notFound();
    }

    // Check if current user is viewing their own profile
    const isOwnProfile = userId === user.id;

    // Fetch watch lists based on privacy settings
    const watchLists = await prisma.watchList.findMany({
        where: {
            userId: user.id,
            OR: [
                { isPublic: true },
                { userId: userId || "" }, // User's own lists
                { friendsOnly: false } // This will be refined when we add friends functionality
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