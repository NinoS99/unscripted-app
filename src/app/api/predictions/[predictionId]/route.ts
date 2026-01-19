import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ predictionId: string }> }
) {
  try {
    const { userId } = await auth();
    const { predictionId: predictionIdStr } = await params;
    const predictionId = parseInt(predictionIdStr);

    if (isNaN(predictionId)) {
      return NextResponse.json({ error: "Invalid prediction ID" }, { status: 400 });
    }

    // Fetch prediction with all related data
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
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
            overview: true,
            stillPath: true,
            season: {
              select: {
                id: true,
                seasonNumber: true,
                overview: true,
                posterPath: true,
                show: {
                  select: {
                    id: true,
                    name: true,
                    posterPath: true,
                    backdropPath: true,
                    overview: true,
                    isCompetition: true,
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
                id: true,
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
            description: true,
            template: true,
          },
        },
        result: {
          select: {
            id: true,
            outcome: true,
            confidence: true,
            source: true,
            evidence: true,
            resolvedAt: true,
            closesAt: true,
            createdAt: true,
            updatedAt: true,
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
    });

    if (!prediction) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    // Get Clerk imageUrl for the prediction author
    let authorImageUrl = null;
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(prediction.user.id);
      authorImageUrl = clerkUser?.imageUrl || null;
    } catch (error) {
      console.error(`Failed to fetch Clerk user for ${prediction.user.id}:`, error);
    }

    // Check if current user has liked this prediction
    let userLike = null;
    if (userId) {
      userLike = await prisma.like.findUnique({
        where: {
          userId_predictionId: {
            userId,
            predictionId: prediction.id,
          },
        },
      });
    }

    // Check if current user has any shares in this prediction
    let userShares = null;
    if (userId) {
      userShares = await prisma.predictionShare.findMany({
        where: {
          userId,
          predictionId: prediction.id,
        },
        select: {
          id: true,
          side: true,
          amount: true,
          price: true,
          transactionAmount: true,
          createdAt: true,
        },
      });
    }

    // Get share statistics (total shares per side)
    const shareStats = await prisma.predictionShare.groupBy({
      by: ["side"],
      where: {
        predictionId: prediction.id,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Format share stats
    const shareStatistics = {
      yes: {
        totalShares: 0,
        totalTraders: 0,
      },
      no: {
        totalShares: 0,
        totalTraders: 0,
      },
    };

    shareStats.forEach((stat) => {
      if (stat.side === "YES") {
        shareStatistics.yes.totalShares = stat._sum.amount || 0;
        shareStatistics.yes.totalTraders = stat._count.id;
      } else if (stat.side === "NO") {
        shareStatistics.no.totalShares = stat._sum.amount || 0;
        shareStatistics.no.totalTraders = stat._count.id;
      }
    });

    // Build response with all data
    const response = {
      ...prediction,
      user: {
        ...prediction.user,
        imageUrl: authorImageUrl,
      },
      userLike: userLike ? { id: userLike.id, createdAt: userLike.createdAt } : null,
      userShares: userShares || [],
      shareStatistics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json({ error: "Failed to fetch prediction" }, { status: 500 });
  }
}
