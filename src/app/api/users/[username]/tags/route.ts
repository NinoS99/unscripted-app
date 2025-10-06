import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Find the user by username to get their userId
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const targetUserId = user.id;

    // Get all tags created by the user across all tag tables (except CharacterTag)
    // We'll use raw SQL for better performance and to get unique tags with counts
    const tagsQuery = `
      WITH user_tags AS (
        -- Show Review Tags
        SELECT 
          t.id,
          t.name,
          'show_review' as source_type,
          sr.id as source_id,
          sr.content as source_content
        FROM "Tag" t
        JOIN "ShowReviewTag" srt ON t.id = srt."tagId"
        JOIN "ShowReview" sr ON srt."showReviewId" = sr.id
        WHERE sr."userId" = $1
        
        UNION ALL
        
        -- Season Review Tags
        SELECT 
          t.id,
          t.name,
          'season_review' as source_type,
          sr.id as source_id,
          sr.content as source_content
        FROM "Tag" t
        JOIN "SeasonReviewTag" srt ON t.id = srt."tagId"
        JOIN "SeasonReview" sr ON srt."seasonReviewId" = sr.id
        WHERE sr."userId" = $1
        
        UNION ALL
        
        -- Episode Review Tags
        SELECT 
          t.id,
          t.name,
          'episode_review' as source_type,
          er.id as source_id,
          er.content as source_content
        FROM "Tag" t
        JOIN "EpisodeReviewTag" ert ON t.id = ert."tagId"
        JOIN "EpisodeReview" er ON ert."episodeReviewId" = er.id
        WHERE er."userId" = $1
        
        UNION ALL
        
        -- WatchList Tags
        SELECT 
          t.id,
          t.name,
          'watchlist' as source_type,
          wl.id as source_id,
          wl.name as source_content
        FROM "Tag" t
        JOIN "WatchListTag" wlt ON t.id = wlt."tagId"
        JOIN "WatchList" wl ON wlt."watchListId" = wl.id
        WHERE wl."userId" = $1
        
        UNION ALL
        
        -- Discussion Tags
        SELECT 
          t.id,
          t.name,
          'discussion' as source_type,
          d.id as source_id,
          d.title as source_content
        FROM "Tag" t
        JOIN "DiscussionTag" dt ON t.id = dt."tagId"
        JOIN "Discussion" d ON dt."discussionId" = d.id
        WHERE d."userId" = $1
      ),
      tag_stats AS (
        SELECT 
          id,
          name,
          COUNT(*) as usage_count,
          ARRAY_AGG(DISTINCT source_type) as source_types,
          ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'source_type', source_type,
              'source_id', source_id,
              'source_content', source_content
            )
          ) as usage_details
        FROM user_tags
        GROUP BY id, name
      )
      SELECT 
        id,
        name,
        usage_count,
        source_types,
        usage_details
      FROM tag_stats
      ORDER BY usage_count DESC, name ASC
      LIMIT $2
    `;

    const tags = await prisma.$queryRawUnsafe(tagsQuery, targetUserId, limit);

    // Convert BigInt values to numbers for JSON serialization
    const serializedTags = (tags as { usage_count: bigint }[]).map(tag => ({
      ...tag,
      usage_count: Number(tag.usage_count)
    }));

    // Get total count of unique tags for pagination info
    const totalCountQuery = `
      WITH user_tags AS (
        SELECT DISTINCT t.id
        FROM "Tag" t
        JOIN "ShowReviewTag" srt ON t.id = srt."tagId"
        JOIN "ShowReview" sr ON srt."showReviewId" = sr.id
        WHERE sr."userId" = $1
        
        UNION
        
        SELECT DISTINCT t.id
        FROM "Tag" t
        JOIN "SeasonReviewTag" srt ON t.id = srt."tagId"
        JOIN "SeasonReview" sr ON srt."seasonReviewId" = sr.id
        WHERE sr."userId" = $1
        
        UNION
        
        SELECT DISTINCT t.id
        FROM "Tag" t
        JOIN "EpisodeReviewTag" ert ON t.id = ert."tagId"
        JOIN "EpisodeReview" er ON ert."episodeReviewId" = er.id
        WHERE er."userId" = $1
        
        UNION
        
        SELECT DISTINCT t.id
        FROM "Tag" t
        JOIN "WatchListTag" wlt ON t.id = wlt."tagId"
        JOIN "WatchList" wl ON wlt."watchListId" = wl.id
        WHERE wl."userId" = $1
        
        UNION
        
        SELECT DISTINCT t.id
        FROM "Tag" t
        JOIN "DiscussionTag" dt ON t.id = dt."tagId"
        JOIN "Discussion" d ON dt."discussionId" = d.id
        WHERE d."userId" = $1
      )
      SELECT COUNT(*) as total
      FROM user_tags
    `;

    const totalCountResult = await prisma.$queryRawUnsafe(totalCountQuery, targetUserId);
    const totalCount = Number((totalCountResult as { total: bigint }[])[0]?.total || 0);

    return NextResponse.json({
      tags: serializedTags,
      pagination: {
        total: totalCount,
        limit,
        hasMore: totalCount > limit
      }
    });

  } catch (error) {
    console.error('Error fetching user tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user tags' },
      { status: 500 }
    );
  }
}
