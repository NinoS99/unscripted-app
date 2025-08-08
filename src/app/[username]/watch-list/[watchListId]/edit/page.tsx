import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/client";
import EditWatchListForm from "@/components/EditWatchListForm";

interface EditWatchListPageProps {
    params: Promise<{ username: string; watchListId: string }>;
}

export default async function EditWatchListPage({ params }: EditWatchListPageProps) {
    const { username, watchListId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const watchListIdNum = parseInt(watchListId);
    if (isNaN(watchListIdNum)) {
        notFound();
    }

    // First check if the user exists
    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
    });

    if (!user) {
        notFound();
    }

    // Fetch the watch list with all related data
    const watchList = await prisma.watchList.findFirst({
        where: {
            id: watchListIdNum,
            userId: user.id, // Ensure the watch list belongs to this user
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    profilePicture: true
                }
            },
            shows: {
                include: {
                    show: {
                        select: {
                            id: true,
                            name: true,
                            posterPath: true,
                            firstAirDate: true,
                            tmdbRating: true
                        }
                    },
                    muchWatchSeasons: {
                        include: {
                            season: {
                                select: {
                                    id: true,
                                    seasonNumber: true
                                }
                            }
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
            }
        }
    });

    if (!watchList) {
        notFound();
    }

    // Check if the logged-in user owns this watch list
    if (watchList.user.id !== userId) {
        redirect("/watch-lists");
    }

    // Get Clerk user data for watch list author
    const clerk = await clerkClient();
    
    // Get Clerk image for watch list author
    let watchListAuthorImage = null;
    try {
        const watchListAuthorClerkUser = await clerk.users.getUser(watchList.user.id);
        watchListAuthorImage = watchListAuthorClerkUser?.imageUrl;
    } catch (error) {
        console.error(`Failed to fetch Clerk user for watch list author ${watchList.user.id}:`, error);
    }

    // Update watch list with Clerk image
    const watchListWithClerkImage = {
        ...watchList,
        user: {
            ...watchList.user,
            profilePicture: watchListAuthorImage,
        },
    };

    return (
        <EditWatchListForm 
            watchList={watchListWithClerkImage}
        />
    );
} 