import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const searchParams = req.nextUrl.searchParams;
    const entityType = searchParams.get("entityType") || "all";

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const discussions: Array<{
      id: number;
      type: 'show' | 'season' | 'episode';
      title: string;
      content: string;
      spoiler: boolean;
      createdAt: Date;
      entityId: number;
      entityName: string;
      posterPath: string | null;
      showId?: number;
      seasonNumber?: number;
      episodeNumber?: number;
      likeCount: number;
      commentCount: number;
      hasPoll: boolean;
    }> = [];

    // Fetch show discussions
    if (entityType === "all" || entityType === "show") {
      const showDiscussions = await prisma.discussion.findMany({
        where: {
          userId: user.id,
          showId: { not: null },
          seasonId: null,
          episodeId: null,
        },
        select: {
          id: true,
          title: true,
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
          _count: {
            select: {
              likes: true,
              comments: true,
              polls: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      showDiscussions.forEach((discussion) => {
        if (discussion.show) {
          discussions.push({
            id: discussion.id,
            type: 'show',
            title: discussion.title,
            content: discussion.content,
            spoiler: discussion.spoiler,
            createdAt: discussion.createdAt,
            entityId: discussion.show.id,
            entityName: discussion.show.name,
            posterPath: discussion.show.posterPath,
            showId: discussion.show.id,
            likeCount: discussion._count.likes,
            commentCount: discussion._count.comments,
            hasPoll: discussion._count.polls > 0,
          });
        }
      });
    }

    // Fetch season discussions
    if (entityType === "all" || entityType === "season") {
      const seasonDiscussions = await prisma.discussion.findMany({
        where: {
          userId: user.id,
          seasonId: { not: null },
          episodeId: null,
        },
        select: {
          id: true,
          title: true,
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
          _count: {
            select: {
              likes: true,
              comments: true,
              polls: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      seasonDiscussions.forEach((discussion) => {
        if (discussion.season) {
          const seasonName = discussion.season.seasonNumber === 0 
            ? "Specials" 
            : `Season ${discussion.season.seasonNumber}`;
          
          discussions.push({
            id: discussion.id,
            type: 'season',
            title: discussion.title,
            content: discussion.content,
            spoiler: discussion.spoiler,
            createdAt: discussion.createdAt,
            entityId: discussion.season.id,
            entityName: `${discussion.season.show.name} - ${seasonName}`,
            posterPath: discussion.season.posterPath || discussion.season.show.posterPath,
            showId: discussion.season.show.id,
            seasonNumber: discussion.season.seasonNumber,
            likeCount: discussion._count.likes,
            commentCount: discussion._count.comments,
            hasPoll: discussion._count.polls > 0,
          });
        }
      });
    }

    // Fetch episode discussions
    if (entityType === "all" || entityType === "episode") {
      const episodeDiscussions = await prisma.discussion.findMany({
        where: {
          userId: user.id,
          episodeId: { not: null },
        },
        select: {
          id: true,
          title: true,
          content: true,
          spoiler: true,
          createdAt: true,
          episode: {
            select: {
              id: true,
              episodeNumber: true,
              name: true,
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
          _count: {
            select: {
              likes: true,
              comments: true,
              polls: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      episodeDiscussions.forEach((discussion) => {
        if (discussion.episode) {
          const seasonPrefix = discussion.episode.season.seasonNumber === 0 
            ? "S" 
            : `S${discussion.episode.season.seasonNumber}`;
          
          discussions.push({
            id: discussion.id,
            type: 'episode',
            title: discussion.title,
            content: discussion.content,
            spoiler: discussion.spoiler,
            createdAt: discussion.createdAt,
            entityId: discussion.episode.id,
            entityName: `${discussion.episode.season.show.name} - ${seasonPrefix}E${discussion.episode.episodeNumber} - ${discussion.episode.name}`,
            posterPath: discussion.episode.season.posterPath || discussion.episode.season.show.posterPath,
            showId: discussion.episode.season.show.id,
            seasonNumber: discussion.episode.season.seasonNumber,
            episodeNumber: discussion.episode.episodeNumber,
            likeCount: discussion._count.likes,
            commentCount: discussion._count.comments,
            hasPoll: discussion._count.polls > 0,
          });
        }
      });
    }

    return NextResponse.json({ discussions });
  } catch (error) {
    console.error("Error fetching user discussions:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussions" },
      { status: 500 }
    );
  }
}

