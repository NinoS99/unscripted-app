import { NextResponse } from "next/server";
import prisma from "@/lib/client";

export async function GET() {
  try {
    const reactionTypes = await prisma.reactionType.findMany({
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        emoji: true,
        category: true,
      },
    });

    // Group by category
    const groupedReactions = reactionTypes.reduce((acc, reaction) => {
      const category = reaction.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(reaction);
      return acc;
    }, {} as Record<string, typeof reactionTypes>);

    return NextResponse.json({ reactionTypes: groupedReactions });
  } catch (error) {
    console.error("Error fetching reaction types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
