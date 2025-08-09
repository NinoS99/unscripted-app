import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const pollId = searchParams.get("pollId");
        const creatorId = searchParams.get("creatorId");

        if (!pollId) {
            return NextResponse.json({ error: "Poll ID is required" }, { status: 400 });
        }

        // Find the current user's vote for this poll
        const userVote = await prisma.pollVote.findFirst({
            where: {
                userId,
                pollOption: {
                    pollId: parseInt(pollId)
                }
            },
            select: {
                pollOptionId: true
            }
        });

        // Find the creator's vote for this poll (if creatorId is provided)
        let creatorVote = null;
        if (creatorId) {
            creatorVote = await prisma.pollVote.findFirst({
                where: {
                    userId: creatorId,
                    pollOption: {
                        pollId: parseInt(pollId)
                    }
                },
                select: {
                    pollOptionId: true
                }
            });
        }

        return NextResponse.json({
            optionId: userVote?.pollOptionId || null,
            creatorOptionId: creatorVote?.pollOptionId || null
        });

    } catch (error) {
        console.error("Error fetching user vote:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
