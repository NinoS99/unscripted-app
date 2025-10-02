import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // The username parameter is actually the userId (Clerk ID)
    const targetUserId = username;

    // Get recent reviews with actual ratings
    const recentReviews = await prisma.$transaction(async (tx) => {
      const showReviews = await tx.showReview.findMany({
        where: { userId: targetUserId },
        include: {
          show: {
            select: { name: true, posterPath: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      const seasonReviews = await tx.seasonReview.findMany({
        where: { userId: targetUserId },
        include: {
          season: {
            select: { 
              seasonNumber: true,
              show: { select: { name: true, posterPath: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      const episodeReviews = await tx.episodeReview.findMany({
        where: { userId: targetUserId },
        include: {
          episode: {
            select: { 
              name: true,
              episodeNumber: true,
              season: {
                select: {
                  seasonNumber: true,
                  show: { select: { name: true, posterPath: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Fetch ratings for all reviews
      const showRatings = await tx.rating.findMany({
        where: {
          userId: targetUserId,
          showId: { in: showReviews.map(r => r.showId) }
        },
        select: { showId: true, rating: true }
      });

      const seasonRatings = await tx.rating.findMany({
        where: {
          userId: targetUserId,
          seasonId: { in: seasonReviews.map(r => r.seasonId) }
        },
        select: { seasonId: true, rating: true }
      });

      const episodeRatings = await tx.rating.findMany({
        where: {
          userId: targetUserId,
          episodeId: { in: episodeReviews.map(r => r.episodeId) }
        },
        select: { episodeId: true, rating: true }
      });

      // Create rating lookup maps
      const showRatingMap = new Map(showRatings.map(r => [r.showId, r.rating]));
      const seasonRatingMap = new Map(seasonRatings.map(r => [r.seasonId, r.rating]));
      const episodeRatingMap = new Map(episodeRatings.map(r => [r.episodeId, r.rating]));

      return [
        ...showReviews.map(review => ({
          id: review.id.toString(),
          type: 'SHOW' as const,
          entityName: review.show.name,
          entityId: review.showId.toString(),
          rating: showRatingMap.get(review.showId) || null,
          content: review.content,
          createdAt: review.createdAt,
          entityPosterPath: review.show.posterPath
        })),
        ...seasonReviews.map(review => ({
          id: review.id.toString(),
          type: 'SEASON' as const,
          entityName: `${review.season.show.name} ${review.season.seasonNumber === 0 ? 'Specials' : `Season ${review.season.seasonNumber}`}`,
          entityId: review.seasonId.toString(),
          rating: seasonRatingMap.get(review.seasonId) || null,
          content: review.content,
          createdAt: review.createdAt,
          entityPosterPath: review.season.show.posterPath
        })),
        ...episodeReviews.map(review => ({
          id: review.id.toString(),
          type: 'EPISODE' as const,
          entityName: `${review.episode.season.show.name} ${review.episode.season.seasonNumber === 0 ? 'Specials ' : `S${review.episode.season.seasonNumber}`}E${review.episode.episodeNumber} ${review.episode.name}`,
          entityId: review.episodeId.toString(),
          rating: episodeRatingMap.get(review.episodeId) || null,
          content: review.content,
          createdAt: review.createdAt,
          entityPosterPath: review.episode.season.show.posterPath
        }))
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
    });

    // Get recent discussions
    const recentDiscussions = await prisma.discussion.findMany({
      where: { userId: targetUserId },
      include: {
        show: { select: { name: true, posterPath: true } },
        season: { 
          select: { 
            seasonNumber: true,
            show: { select: { name: true, posterPath: true } }
          }
        },
        episode: {
          select: {
            name: true,
            episodeNumber: true,
            season: {
              select: {
                seasonNumber: true,
                show: { select: { name: true, posterPath: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedDiscussions = recentDiscussions.map(discussion => {
      let entityName = '';
      let entityId = '';
      let entityType = '';
      let entityPosterPath = '';

      if (discussion.show) {
        entityName = discussion.show.name;
        entityId = discussion.showId?.toString() || '';
        entityType = 'show';
        entityPosterPath = discussion.show.posterPath || '';
      } else if (discussion.season) {
        entityName = `${discussion.season.show.name} ${discussion.season.seasonNumber === 0 ? 'Specials' : `Season ${discussion.season.seasonNumber}`}`;
        entityId = discussion.seasonId?.toString() || '';
        entityType = 'season';
        entityPosterPath = discussion.season.show.posterPath || '';
      } else if (discussion.episode) {
        entityName = `${discussion.episode.season.show.name} ${discussion.episode.season.seasonNumber === 0 ? 'Specials ' : `S${discussion.episode.season.seasonNumber}`}E${discussion.episode.episodeNumber} ${discussion.episode.name}`;
        entityId = discussion.episodeId?.toString() || '';
        entityType = 'episode';
        entityPosterPath = discussion.episode.season.show.posterPath || '';
      }

      return {
        id: discussion.id.toString(),
        title: discussion.title,
        content: discussion.content,
        createdAt: discussion.createdAt,
        entityName,
        entityId,
        entityType,
        entityPosterPath
      };
    });

    // Get recent watchlists
    const recentWatchlists = await prisma.watchList.findMany({
      where: { userId: targetUserId },
      include: {
        _count: {
          select: { shows: true }
        },
        shows: {
          take: 4,
          orderBy: { ranking: 'asc' },
          include: {
            show: {
              select: { posterPath: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedWatchlists = recentWatchlists.map(watchlist => ({
      id: watchlist.id.toString(),
      name: watchlist.name,
      description: watchlist.description,
      createdAt: watchlist.createdAt,
      showCount: watchlist._count.shows,
      posterPaths: watchlist.shows.map(s => s.show.posterPath).filter((p): p is string => p !== null)
    }));

    return NextResponse.json({
      reviews: recentReviews,
      discussions: formattedDiscussions,
      watchlists: formattedWatchlists
    });

  } catch (error) {
    console.error('Error fetching recent content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent content' },
      { status: 500 }
    );
  }
}
