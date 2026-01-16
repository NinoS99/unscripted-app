import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from "@/lib/client";

type RatingResponse = {
  showRating?: number | null
  seasonRating?: number | null
  episodeRating?: number | null
  error?: string
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(req.url)
    
    const showId = searchParams.get('showId')
    const seasonId = searchParams.get('seasonId')
    const episodeId = searchParams.get('episodeId')

    // Initialize response object
    const responseData: RatingResponse = {}

    // Fetch show rating if showId provided
    if (showId && !seasonId && !episodeId) {
      const rating = await prisma.rating.findFirst({
        where: {
          userId: userId || undefined, // Only filter by user if authenticated
          showId: Number(showId)
        },
        select: { rating: true }
      })
      responseData.showRating = rating?.rating || null
    }
    // Fetch season rating if seasonId provided
    else if (seasonId && !showId && !episodeId) {
      const rating = await prisma.rating.findFirst({
        where: {
          userId: userId || undefined,
          seasonId: Number(seasonId)
        },
        select: { rating: true }
      })
      responseData.seasonRating = rating?.rating || null
    }
    // Fetch episode rating if episodeId provided
    else if (episodeId && !showId && !seasonId) {
      const rating = await prisma.rating.findFirst({
        where: {
          userId: userId || undefined,
          episodeId: Number(episodeId)
        },
        select: { rating: true }
      })
      responseData.episodeRating = rating?.rating || null
    }
    else {
      return NextResponse.json(
        { error: 'Must provide exactly one of: showId, seasonId, or episodeId' },
        { status: 400 }
      )
    }

    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { showId, seasonId, episodeId, rating } = body

    // Validate rating value (0.5 to 5.0 in 0.5 increments)
    if (typeof rating !== 'number' || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      return NextResponse.json(
        { error: 'Rating must be between 0.5 and 5.0 in 0.5 increments' },
        { status: 400 }
      )
    }

    // Validate exactly one ID is provided
    const ids = [showId, seasonId, episodeId].filter(Boolean)
    if (ids.length !== 1) {
      return NextResponse.json(
        { error: 'Must provide exactly one entity ID' },
        { status: 400 }
      )
    }

    const ratingData = {
      userId,
      rating,
      showId: showId ? Number(showId) : undefined,
      seasonId: seasonId ? Number(seasonId) : undefined,
      episodeId: episodeId ? Number(episodeId) : undefined,
    }

    const upsertedRating = await prisma.rating.upsert({
      where: {
        userId_showId: showId ? { userId, showId: Number(showId) } : undefined,
        userId_seasonId: seasonId ? { userId, seasonId: Number(seasonId) } : undefined,
        userId_episodeId: episodeId ? { userId, episodeId: Number(episodeId) } : undefined,
      },
      create: ratingData,
      update: { rating },
      select: {
        rating: true,
        show: showId ? { select: { id: true, name: true } } : false,
        season: seasonId ? { select: { id: true, seasonNumber: true } } : false,
        episode: episodeId ? { select: { id: true, episodeNumber: true } } : false,
      }
    })

    return NextResponse.json({ 
      success: true,
      rating: upsertedRating.rating,
      entity: showId ? 'show' : seasonId ? 'season' : 'episode'
    }, { status: 200 })

  } catch (error) {
    console.error('Error submitting rating:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}

// Add this to your existing rating route file
export async function DELETE(req: Request) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
  
      const { searchParams } = new URL(req.url);
      const showId = searchParams.get('showId');
      const seasonId = searchParams.get('seasonId');
      const episodeId = searchParams.get('episodeId');
  
      // Validate exactly one ID is provided
      const ids = [showId, seasonId, episodeId].filter(Boolean);
      if (ids.length !== 1) {
        return NextResponse.json(
          { error: 'Must provide exactly one entity ID' },
          { status: 400 }
        );
      }
  
      // Delete the rating
      const deletedRating = await prisma.rating.deleteMany({
        where: {
          userId,
          showId: showId ? Number(showId) : undefined,
          seasonId: seasonId ? Number(seasonId) : undefined,
          episodeId: episodeId ? Number(episodeId) : undefined,
        },
      });
  
      if (deletedRating.count === 0) {
        return NextResponse.json(
          { error: 'No rating found to delete' },
          { status: 404 }
        );
      }
  
      return NextResponse.json(
        { success: true, message: 'Rating removed' },
        { status: 200 }
      );
  
    } catch (error) {
      console.error('Error deleting rating:', error);
      return NextResponse.json(
        { error: 'Failed to delete rating' },
        { status: 500 }
      );
    }
  }