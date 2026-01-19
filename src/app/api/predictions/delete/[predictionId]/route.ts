import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ predictionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { predictionId: predictionIdStr } = await params;
    const predictionId = parseInt(predictionIdStr);

    if (isNaN(predictionId)) {
      return NextResponse.json({ error: "Invalid prediction ID" }, { status: 400 });
    }

    // Verify the prediction exists and belongs to the user
    const prediction = await prisma.prediction.findFirst({
      where: {
        id: predictionId,
        userId: userId,
      },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: "Prediction not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if any shares have been bought for this prediction
    const shareCount = await prisma.predictionShare.count({
      where: {
        predictionId: predictionId,
      },
    });

    if (shareCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete prediction: shares have already been purchased. Predictions with active trading cannot be deleted.",
        },
        { status: 400 }
      );
    }

    // Delete the prediction (cascade will handle related records like PredictionResult, comments, etc.)
    await prisma.prediction.delete({
      where: { id: predictionId },
    });

    return NextResponse.json({ message: "Prediction deleted successfully" });
  } catch (error) {
    console.error("Error deleting prediction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
