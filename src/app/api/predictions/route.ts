import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trackUserActivity } from "@/lib/activityTracker";
import { PredictionOutcome, ResultSource } from "@prisma/client";
import prisma from "@/lib/client";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      episodeId,
      characterId,
      templateId,
      manualCharacterName,
      predictionText,
      spoiler,
    } = body;

    // Validate required fields
    if (!title?.trim() || !content?.trim() || !predictionText?.trim()) {
      return NextResponse.json(
        { error: "Title, content, and predictionText are required" },
        { status: 400 }
      );
    }

    if (!episodeId) {
      return NextResponse.json(
        { error: "Episode ID is required" },
        { status: 400 }
      );
    }

    // Validate that characterId and manualCharacterName are not both provided
    if (characterId && manualCharacterName?.trim()) {
      return NextResponse.json(
        {
          error:
            "Cannot provide both characterId and manualCharacterName. Use one or the other.",
        },
        { status: 400 }
      );
    }

    // Fetch episode and validate it exists and has airDate
    const episode = await prisma.episode.findUnique({
      where: { id: parseInt(episodeId) },
      select: {
        id: true,
        airDate: true,
        name: true,
        season: {
          select: {
            show: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    if (!episode.airDate) {
      return NextResponse.json(
        { error: "Episode must have a non-null air date" },
        { status: 400 }
      );
    }

    // Validate that prediction is made at most 1 day before air date
    // All DateTime values in Prisma are stored in UTC, so we work in UTC consistently
    const now = new Date(); // Current time in UTC
    const airDate = new Date(episode.airDate); // Air date (already in UTC from DB)

    // Calculate one day before air date (24 hours = 24 * 60 * 60 * 1000 milliseconds)
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const oneDayBeforeAirDate = new Date(airDate.getTime() - oneDayInMs);

    // Require prediction to be made at least 1 day before air date
    if (now >= oneDayBeforeAirDate) {
      const hoursUntilDeadline = Math.ceil(
        (oneDayBeforeAirDate.getTime() - now.getTime()) / (60 * 60 * 1000)
      );
      return NextResponse.json(
        {
          error:
            hoursUntilDeadline > 0
              ? `Predictions must be made at least 1 day before the episode air date. You can make this prediction in ${hoursUntilDeadline} hour${hoursUntilDeadline !== 1 ? "s" : ""}.`
              : "Predictions must be made at least 1 day before the episode air date. The deadline has passed.",
        },
        { status: 400 }
      );
    }

    // Calculate closesAt: 6 hours before air date (in UTC)
    // Working in UTC ensures no timezone issues - the 6-hour offset is consistent regardless of user's timezone
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const closesAt = new Date(airDate.getTime() - sixHoursInMs);

    // If closesAt is in the past, reject the prediction
    if (closesAt <= now) {
      return NextResponse.json(
        {
          error:
            "Cannot create prediction: closing time (6 hours before air date) has already passed",
        },
        { status: 400 }
      );
    }

    // Validate characterId if provided
    if (characterId) {
      const character = await prisma.character.findUnique({
        where: { id: parseInt(characterId) },
      });

      if (!character) {
        return NextResponse.json(
          { error: "Character not found" },
          { status: 404 }
        );
      }
    }

    // Validate templateId if provided
    if (templateId) {
      const template = await prisma.predictionTemplate.findUnique({
        where: { id: parseInt(templateId) },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Prediction template not found" },
          { status: 404 }
        );
      }
    }

    // Create Prediction and PredictionResult in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Prediction
      const prediction = await tx.prediction.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          userId,
          episodeId: parseInt(episodeId),
          ...(characterId && { characterId: parseInt(characterId) }),
          ...(templateId && { templateId: parseInt(templateId) }),
          ...(manualCharacterName?.trim() && {
            manualCharacterName: manualCharacterName.trim(),
          }),
          predictionText: predictionText.trim(),
          closesAt,
          isActive: true,
          spoiler: spoiler || false,
        },
        include: {
          episode: {
            select: {
              name: true,
              airDate: true,
              season: {
                select: {
                  show: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          character: {
            select: {
              id: true,
              person: {
                select: {
                  name: true,
                },
              },
            },
          },
          template: {
            select: {
              name: true,
            },
          },
        },
      });

      // Create PredictionResult with PENDING status
      const predictionResult = await tx.predictionResult.create({
        data: {
          predictionId: prediction.id,
          outcome: PredictionOutcome.PENDING,
          source: ResultSource.PENDING,
          closesAt, // Same closesAt as Prediction
          // confidence, evidence, and resolvedAt remain null initially
        },
      });

      return { prediction, predictionResult };
    });

    // Track user activity and award points
    await trackUserActivity({
      userId,
      activityType: "PREDICTION_CREATED",
      entityType: "PREDICTION",
      entityId: result.prediction.id,
      description: "Created a prediction",
      metadata: {
        episodeId: parseInt(episodeId),
        episodeName: episode.name,
        showName: episode.season.show.name,
        predictionText: predictionText.trim(),
        hasCharacter: !!(characterId || manualCharacterName),
        hasTemplate: !!templateId,
      },
    });

    return NextResponse.json(
      {
        prediction: result.prediction,
        result: result.predictionResult,
        message: "Prediction created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating prediction:", error);
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get("episodeId");
    const userIdParam = searchParams.get("userId");
    const status = searchParams.get("status"); // "active", "past", "all"
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: {
      episodeId?: number;
      userId?: string;
      isActive?: boolean;
      closesAt?: { lt?: Date; gte?: Date };
    } = {};

    if (episodeId) {
      const episodeIdNum = parseInt(episodeId);
      if (isNaN(episodeIdNum)) {
        return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });
      }
      whereClause.episodeId = episodeIdNum;
    }

    if (userIdParam) {
      whereClause.userId = userIdParam;
    }

    // Handle status filter
    const now = new Date();
    if (status === "past") {
      // Past predictions: predictions that have closed (closesAt < now)
      // This includes both resolved and unresolved past predictions
      whereClause.closesAt = { lt: now };
    } else if (status === "all") {
      // Show all predictions regardless of status
      // Don't filter by isActive or closesAt
    } else {
      // Default: only active predictions (not yet closed and still active)
      whereClause.isActive = true;
      whereClause.closesAt = { gte: now };
    }

    // Fetch predictions with related data
    const predictions = await prisma.prediction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        episode: {
          select: {
            id: true,
            name: true,
            episodeNumber: true,
            airDate: true,
            season: {
              select: {
                seasonNumber: true,
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
        character: {
          select: {
            id: true,
            showRole: true,
            person: {
              select: {
                name: true,
                profilePath: true,
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        result: {
          select: {
            outcome: true,
            source: true,
            resolvedAt: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            reactions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Get Clerk imageUrls for all prediction authors
    const userIds = [...new Set(predictions.map((p) => p.user.id))];
    const imageUrls: Record<string, string | null> = {};

    try {
      const clerk = await clerkClient();
      for (const uid of userIds) {
        try {
          const clerkUser = await clerk.users.getUser(uid);
          imageUrls[uid] = clerkUser?.imageUrl || null;
        } catch (error) {
          console.error(`Failed to fetch Clerk user for ${uid}:`, error);
          imageUrls[uid] = null;
        }
      }
    } catch (error) {
      console.error("Failed to initialize Clerk client:", error);
    }

    // Add imageUrls to predictions
    const predictionsWithImages = predictions.map((prediction) => ({
      ...prediction,
      user: {
        ...prediction.user,
        imageUrl: imageUrls[prediction.user.id] || null,
      },
    }));

    // Get total count for pagination
    const total = await prisma.prediction.count({ where: whereClause });

    return NextResponse.json({
      predictions: predictionsWithImages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}
