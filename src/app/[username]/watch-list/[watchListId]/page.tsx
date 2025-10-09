import { auth, clerkClient } from "@clerk/nextjs/server";
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

    // Check if current user is viewing their own profile
    const isOwnProfile = userId === user.id;

    // Check if current user is friends with the profile owner
    let isFriend = false;
    if (userId && !isOwnProfile) {
        const [currentUserFollowsOwner, ownerFollowsCurrentUser] = await Promise.all([
            prisma.userFollow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: user.id,
                    },
                },
            }),
            prisma.userFollow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: user.id,
                        followingId: userId,
                    },
                },
            }),
        ]);

        isFriend = !!(currentUserFollowsOwner && ownerFollowsCurrentUser);
    }

    // Fetch the watch list with all related data
    const watchList = await prisma.watchList.findFirst({
        where: {
            id: watchListIdNum,
            userId: user.id, // Ensure the watch list belongs to this user
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
            user: {
                select: {
                    id: true,
                    username: true
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
                            username: true
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

    // Get Clerk user data for watch list author and all comment authors
    const clerk = await clerkClient();
    
    // Get Clerk image for watch list author
    let watchListAuthorImage = null;
    try {
        const watchListAuthorClerkUser = await clerk.users.getUser(watchList.user.id);
        watchListAuthorImage = watchListAuthorClerkUser?.imageUrl;
    } catch (error) {
        console.error(`Failed to fetch Clerk user for watch list author ${watchList.user.id}:`, error);
    }

    // Get Clerk images for all comment authors
    const commentsWithClerkImages = await Promise.all(
        (watchList.comments || []).map(async (comment) => {
                            try {
                    const clerkUser = await clerk.users.getUser(comment.user.id);
                    return {
                        ...comment,
                        user: {
                            ...comment.user,
                            profilePicture: clerkUser?.imageUrl,
                        },
                    };
                } catch (error) {
                    // If Clerk user lookup fails, log error but don't fall back
                    console.error(`Failed to fetch Clerk user for ${comment.user.id}:`, error);
                    return {
                        ...comment,
                        user: {
                            ...comment.user,
                            profilePicture: null,
                        },
                    };
                }
        })
    );

    // Update watch list with Clerk images
    const watchListWithClerkImages = {
        ...watchList,
        user: {
            ...watchList.user,
            profilePicture: watchListAuthorImage,
        },
        comments: commentsWithClerkImages,
    };

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
            watchList={watchListWithClerkImages}
            userLiked={userLiked}
        />
    );
} 