import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    
    // The username parameter is actually the userId (Clerk ID)
    const targetUserId = username;

    // Build date filter for the year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year + 1, 0, 1); // January 1st of next year

    // Get user account creation date first
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { createdAt: true }
    });

    const accountCreatedYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

    // Execute all queries in parallel for better performance
    const [
      // Watched counts
      watchedShows,
      watchedSeasons,
      watchedEpisodes,
      
      // Rating counts and averages
      showRatings,
      seasonRatings,
      episodeRatings,
      
      // Review counts
      showReviews,
      seasonReviews,
      episodeReviews,
      
      // Other activity counts
      discussions,
      watchlists
    ] = await Promise.all([
      // Watched counts
      prisma.watched.count({
        where: {
          userId: targetUserId,
          showId: { not: null },
          seasonId: null,
          episodeId: null,
          createdAt: { gte: startDate, lt: endDate }
        }
      }),
      
      prisma.watched.count({
        where: {
          userId: targetUserId,
          seasonId: { not: null },
          episodeId: null,
          createdAt: { gte: startDate, lt: endDate }
        }
      }),
      
      prisma.watched.count({
        where: {
          userId: targetUserId,
          episodeId: { not: null },
          createdAt: { gte: startDate, lt: endDate }
        }
      }),
      
      // Rating counts and averages
      prisma.rating.findMany({
        where: {
          userId: targetUserId,
          showId: { not: null },
          seasonId: null,
          episodeId: null,
          createdAt: { gte: startDate, lt: endDate }
        },
        select: { rating: true }
      }),
      
      prisma.rating.findMany({
        where: {
          userId: targetUserId,
          seasonId: { not: null },
          episodeId: null,
          createdAt: { gte: startDate, lt: endDate }
        },
        select: { rating: true }
      }),
      
      prisma.rating.findMany({
        where: {
          userId: targetUserId,
          episodeId: { not: null },
          createdAt: { gte: startDate, lt: endDate }
        },
        select: { rating: true }
      }),
      
      // Review counts
      prisma.showReview.count({
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate, lt: endDate }
        }
      }),
      
      prisma.seasonReview.count({
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate, lt: endDate }
        }
      }),
      
      prisma.episodeReview.count({
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate, lt: endDate }
        }
      }),
      
      // Other activity counts
      prisma.discussion.count({
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate, lt: endDate }
        }
      }),
      
      prisma.watchList.count({
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate, lt: endDate }
        }
      })
    ]);

    // Calculate average ratings
    const calculateAverage = (ratings: { rating: number }[]) => {
      if (ratings.length === 0) return 0;
      return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    };

    const averageShowRating = calculateAverage(showRatings);
    const averageSeasonRating = calculateAverage(seasonRatings);
    const averageEpisodeRating = calculateAverage(episodeRatings);

    const stats = {
      year,
      accountCreatedYear,
      watchedCounts: {
        shows: watchedShows,
        seasons: watchedSeasons,
        episodes: watchedEpisodes,
        total: watchedShows + watchedSeasons + watchedEpisodes
      },
      ratingCounts: {
        shows: showRatings.length,
        seasons: seasonRatings.length,
        episodes: episodeRatings.length,
        total: showRatings.length + seasonRatings.length + episodeRatings.length
      },
      averageRatings: {
        shows: Math.round(averageShowRating * 10) / 10, // Round to 1 decimal
        seasons: Math.round(averageSeasonRating * 10) / 10,
        episodes: Math.round(averageEpisodeRating * 10) / 10,
        overall: Math.round(((averageShowRating * showRatings.length + averageSeasonRating * seasonRatings.length + averageEpisodeRating * episodeRatings.length) / (showRatings.length + seasonRatings.length + episodeRatings.length)) * 10) / 10 || 0
      },
      reviewCounts: {
        shows: showReviews,
        seasons: seasonReviews,
        episodes: episodeReviews,
        total: showReviews + seasonReviews + episodeReviews
      },
      activityCounts: {
        discussions,
        watchlists,
        total: discussions + watchlists
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
