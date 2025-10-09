import { NextResponse } from "next/server";
import prisma from "@/lib/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || "all";

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let showReviews: Array<{
      id: number;
      content: string;
      spoiler: boolean;
      createdAt: Date;
      show: {
        id: number;
        name: string;
        posterPath: string | null;
      };
      likes: Array<{ id: number }>;
      comments: Array<{ id: number }>;
    }> = [];
    
    let seasonReviews: Array<{
      id: number;
      content: string;
      spoiler: boolean;
      createdAt: Date;
      season: {
        id: number;
        seasonNumber: number;
        posterPath: string | null;
        show: {
          id: number;
          name: string;
          posterPath: string | null;
        };
      };
      likes: Array<{ id: number }>;
      comments: Array<{ id: number }>;
    }> = [];
    
    let episodeReviews: Array<{
      id: number;
      content: string;
      spoiler: boolean;
      createdAt: Date;
      episode: {
        id: number;
        name: string;
        episodeNumber: number;
        season: {
          id: number;
          seasonNumber: number;
          posterPath: string | null;
          show: {
            id: number;
            name: string;
            posterPath: string | null;
          };
        };
      };
      likes: Array<{ id: number }>;
      comments: Array<{ id: number }>;
    }> = [];

    // Fetch show reviews if needed
    if (entityType === "all" || entityType === "show") {
      showReviews = await prisma.showReview.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          content: true,
          spoiler: true,
          createdAt: true,
          show: {
            select: {
              id: true,
              name: true,
              posterPath: true,
            },
          },
          likes: {
            select: { id: true },
          },
          comments: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Fetch season reviews if needed
    if (entityType === "all" || entityType === "season") {
      seasonReviews = await prisma.seasonReview.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          content: true,
          spoiler: true,
          createdAt: true,
          season: {
            select: {
              id: true,
              seasonNumber: true,
              posterPath: true,
              show: {
                select: {
                  id: true,
                  name: true,
                  posterPath: true,
                },
              },
            },
          },
          likes: {
            select: { id: true },
          },
          comments: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Fetch episode reviews if needed
    if (entityType === "all" || entityType === "episode") {
      episodeReviews = await prisma.episodeReview.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          content: true,
          spoiler: true,
          createdAt: true,
          episode: {
            select: {
              id: true,
              name: true,
              episodeNumber: true,
              season: {
                select: {
                  id: true,
                  seasonNumber: true,
                  posterPath: true,
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
          },
          likes: {
            select: { id: true },
          },
          comments: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Get user ratings for these entities
    const showIds = showReviews.map(r => r.show.id);
    const seasonIds = seasonReviews.map(r => r.season.id);
    const episodeIds = episodeReviews.map(r => r.episode.id);

    const [showRatings, seasonRatings, episodeRatings] = await Promise.all([
      showIds.length > 0 ? prisma.rating.findMany({
        where: {
          userId: user.id,
          showId: { in: showIds },
        },
        select: { showId: true, rating: true },
      }) : [],
      seasonIds.length > 0 ? prisma.rating.findMany({
        where: {
          userId: user.id,
          seasonId: { in: seasonIds },
        },
        select: { seasonId: true, rating: true },
      }) : [],
      episodeIds.length > 0 ? prisma.rating.findMany({
        where: {
          userId: user.id,
          episodeId: { in: episodeIds },
        },
        select: { episodeId: true, rating: true },
      }) : [],
    ]);

    const showRatingsMap = new Map(showRatings.map(r => [r.showId, r.rating]));
    const seasonRatingsMap = new Map(seasonRatings.map(r => [r.seasonId, r.rating]));
    const episodeRatingsMap = new Map(episodeRatings.map(r => [r.episodeId, r.rating]));

    // Transform and combine all reviews
    const allReviews = [
      ...showReviews.map(review => ({
        id: review.id,
        type: 'show' as const,
        content: review.content,
        spoiler: review.spoiler,
        createdAt: review.createdAt,
        entityId: review.show.id,
        entityName: review.show.name,
        posterPath: review.show.posterPath,
        userRating: showRatingsMap.get(review.show.id),
        likeCount: review.likes.length,
        commentCount: review.comments.length,
      })),
      ...seasonReviews.map(review => ({
        id: review.id,
        type: 'season' as const,
        content: review.content,
        spoiler: review.spoiler,
        createdAt: review.createdAt,
        entityId: review.season.id,
        entityName: `${review.season.show.name} - ${review.season.seasonNumber === 0 ? 'Specials' : `Season ${review.season.seasonNumber}`}`,
        posterPath: review.season.posterPath || review.season.show.posterPath,
        showId: review.season.show.id,
        seasonNumber: review.season.seasonNumber,
        userRating: seasonRatingsMap.get(review.season.id),
        likeCount: review.likes.length,
        commentCount: review.comments.length,
      })),
      ...episodeReviews.map(review => ({
        id: review.id,
        type: 'episode' as const,
        content: review.content,
        spoiler: review.spoiler,
        createdAt: review.createdAt,
        entityId: review.episode.id,
        entityName: `${review.episode.season.show.name} - S${review.episode.season.seasonNumber}E${review.episode.episodeNumber} - ${review.episode.name}`,
        posterPath: review.episode.season.posterPath || review.episode.season.show.posterPath,
        showId: review.episode.season.show.id,
        seasonNumber: review.episode.season.seasonNumber,
        episodeNumber: review.episode.episodeNumber,
        userRating: episodeRatingsMap.get(review.episode.id),
        likeCount: review.likes.length,
        commentCount: review.comments.length,
      })),
    ];

    return NextResponse.json({
      reviews: allReviews,
      total: allReviews.length,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch user reviews" },
      { status: 500 }
    );
  }
}

