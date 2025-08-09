import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, tags, spoiler, entityType, entityId, poll } = body;

        // Validate required fields
        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        if (!entityType || !entityId) {
            return NextResponse.json({ error: "Entity type and ID are required" }, { status: 400 });
        }

        // Validate entity exists
        let entity;
        switch (entityType) {
            case "show":
                entity = await prisma.show.findUnique({ where: { id: entityId } });
                break;
            case "season":
                entity = await prisma.season.findUnique({ where: { id: entityId } });
                break;
            case "episode":
                entity = await prisma.episode.findUnique({ where: { id: entityId } });
                break;
            default:
                return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
        }

        if (!entity) {
            return NextResponse.json({ error: "Entity not found" }, { status: 404 });
        }

        // Create discussion
        const discussion = await prisma.discussion.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                spoiler: spoiler || false,
                userId,
                ...(entityType === "show" && { showId: entityId }),
                ...(entityType === "season" && { seasonId: entityId }),
                ...(entityType === "episode" && { episodeId: entityId }),
            },
        });

        // Create tags if provided
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // Find or create tag
                let tag = await prisma.tag.findUnique({
                    where: { name: tagName.toLowerCase() }
                });

                if (!tag) {
                    tag = await prisma.tag.create({
                        data: { name: tagName.toLowerCase() }
                    });
                }

                // Link tag to discussion
                await prisma.discussionTag.create({
                    data: {
                        discussionId: discussion.id,
                        tagId: tag.id
                    }
                });
            }
        }

        // Create poll if provided
        if (poll && poll.question && poll.options && poll.options.length >= 2) {
            const createdPoll = await prisma.poll.create({
                data: {
                    question: poll.question.trim(),
                    discussionId: discussion.id,
                }
            });

            // Create poll options
            for (const optionText of poll.options) {
                if (optionText.trim()) {
                    await prisma.pollOption.create({
                        data: {
                            text: optionText.trim(),
                            pollId: createdPoll.id
                        }
                    });
                }
            }
        }

        return NextResponse.json({ 
            discussion,
            message: "Discussion created successfully" 
        });

    } catch (error) {
        console.error("Error creating discussion:", error);
        return NextResponse.json(
            { error: "Failed to create discussion" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get("entityType");
        const entityId = searchParams.get("entityId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        const whereClause: {
            showId?: number;
            seasonId?: number;
            episodeId?: number;
        } = {};

        if (entityType && entityId) {
            switch (entityType) {
                case "show":
                    whereClause.showId = parseInt(entityId);
                    break;
                case "season":
                    whereClause.seasonId = parseInt(entityId);
                    break;
                case "episode":
                    whereClause.episodeId = parseInt(entityId);
                    break;
            }
        }

        // If entityType and entityId are provided, return recent and popular discussions
        if (entityType && entityId) {
            const includeClause = {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true
                    }
                }
            };

            // Fetch recent discussions (by creation date)
            const recentDiscussions = await prisma.discussion.findMany({
                where: whereClause,
                include: includeClause,
                orderBy: {
                    createdAt: "desc"
                },
                take: 3
            });

            // Fetch popular discussions (by likes count)
            const popularDiscussions = await prisma.discussion.findMany({
                where: whereClause,
                include: includeClause,
                orderBy: {
                    createdAt: "desc"
                },
                take: 3
            });

            // Sort by likes count in memory since Prisma doesn't support ordering by _count directly
            popularDiscussions.sort((a, b) => b._count.likes - a._count.likes);

            return NextResponse.json({
                recent: recentDiscussions,
                popular: popularDiscussions
            });
        }

        // Default behavior for general discussion listing
        const discussions = await prisma.discussion.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        username: true,
                        profilePicture: true,
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                polls: {
                    include: {
                        options: {
                            include: {
                                _count: {
                                    select: {
                                        votes: true
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            skip: offset,
            take: limit
        });

        const total = await prisma.discussion.count({ where: whereClause });

        return NextResponse.json({
            discussions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching discussions:", error);
        return NextResponse.json(
            { error: "Failed to fetch discussions" },
            { status: 500 }
        );
    }
}
