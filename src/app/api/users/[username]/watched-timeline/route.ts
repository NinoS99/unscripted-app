import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate date range for the year
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch watched shows and seasons for the current year
    const watchedEntries = await prisma.watched.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { showId: { not: null }, seasonId: null, episodeId: null }, // Only shows
          { seasonId: { not: null }, episodeId: null }, // Only seasons (not individual episodes)
        ],
      },
      include: {
        show: {
          select: {
            id: true,
            name: true,
            posterPath: true,
          },
        },
        season: {
          select: {
            id: true,
            seasonNumber: true,
            showId: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group entries by date and nest seasons under shows
    const groupedByDate = watchedEntries.reduce((acc, entry) => {
      const dateKey = new Date(entry.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (!acc[dateKey]) {
        acc[dateKey] = {
          shows: [],
          seasons: [],
        };
      }

      if (entry.seasonId && entry.season) {
        const showName = entry.season.show?.name || 'Unknown Show';
        const seasonLabel = entry.season.seasonNumber === 0 ? 'Specials' : `Season ${entry.season.seasonNumber}`;
        
        acc[dateKey].seasons.push({
          id: entry.id,
          type: 'season' as const,
          name: seasonLabel,
          fullName: `${showName} - ${seasonLabel}`,
          posterPath: entry.season.posterPath || entry.season.show?.posterPath || null,
          showId: entry.season.showId,
          seasonNumber: entry.season.seasonNumber,
          createdAt: entry.createdAt,
        });
      } else if (entry.showId && entry.show) {
        acc[dateKey].shows.push({
          id: entry.id,
          type: 'show' as const,
          name: entry.show.name,
          posterPath: entry.show.posterPath || null,
          showId: entry.show.id,
          createdAt: entry.createdAt,
        });
      }

      return acc;
    }, {} as Record<string, {
      shows: Array<{
        id: number;
        type: 'show';
        name: string;
        posterPath: string | null;
        showId: number;
        createdAt: Date;
      }>;
      seasons: Array<{
        id: number;
        type: 'season';
        name: string;
        fullName: string;
        posterPath: string | null;
        showId: number;
        seasonNumber: number;
        createdAt: Date;
      }>;
    }>);

    // Combine and organize shows and seasons for each date
    const organizedTimeline = Object.entries(groupedByDate).reduce((acc, [date, content]) => {
      const organized: Array<{
        id: number;
        type: 'show' | 'season';
        name: string;
        posterPath: string | null;
        showId: number;
        seasonNumber?: number;
        createdAt: Date;
        isNested?: boolean;
      }> = [];

      // Create a map of shows by ID for quick lookup
      const showsMap = new Map(content.shows.map(show => [show.showId, show]));

      // Process each show
      content.shows.forEach(show => {
        organized.push(show);

        // Find seasons that belong to this show
        const relatedSeasons = content.seasons.filter(season => season.showId === show.showId);
        relatedSeasons.forEach(season => {
          organized.push({
            ...season,
            name: season.name, // Just "Season X" or "Specials"
            isNested: true,
          });
        });
      });

      // Add seasons whose shows weren't watched on the same day
      const orphanSeasons = content.seasons.filter(season => !showsMap.has(season.showId));
      orphanSeasons.forEach(season => {
        organized.push({
          ...season,
          name: season.fullName, // "Show Name - Season X"
        });
      });

      acc[date] = organized;
      return acc;
    }, {} as Record<string, Array<{
      id: number;
      type: 'show' | 'season';
      name: string;
      posterPath: string | null;
      showId: number;
      seasonNumber?: number;
      createdAt: Date;
      isNested?: boolean;
    }>>);

    return NextResponse.json({
      timeline: organizedTimeline,
    });
  } catch (error) {
    console.error("Error fetching watched timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch watched timeline" },
      { status: 500 }
    );
  }
}

