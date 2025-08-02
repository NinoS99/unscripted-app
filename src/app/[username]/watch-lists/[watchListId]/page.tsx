import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/client";
import WatchListDetail from "@/components/WatchListDetail";

interface WatchListPageProps {
    params: Promise<{ username: string; watchListId: string }>;
}

export default async function WatchListPage({ params }: WatchListPageProps) {
    const { username, watchListId } = await params;
    const { userId } = await auth();

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
            OR: [
                { isPublic: true },
                { userId: userId || "" }, // User's own lists
                { friendsOnly: false } // This will be refined when we add friends functionality
            ]
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
            },
            comments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            profilePicture: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            },
            _count: {
                select: {
                    likes: true,
                    comments: true
                }
            }
        }
    });

    if (!watchList) {
        notFound();
    }

    // Check if user has liked this watch list
    let userLiked = false;
    if (userId) {
        const like = await prisma.like.findFirst({
            where: {
                userId,
                watchListId: watchListIdNum
            }
        });
        userLiked = !!like;
    }

    return (
        <WatchListDetail 
            watchList={watchList}
            userLiked={userLiked}
        />
    );
} 