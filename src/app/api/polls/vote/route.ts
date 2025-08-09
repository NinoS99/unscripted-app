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
        const { optionId, pollId } = body;

        if (!optionId || !pollId) {
            return NextResponse.json({ error: "Option ID and Poll ID are required" }, { status: 400 });
        }

        // Check if user has already voted on this poll
        const existingVote = await prisma.pollVote.findFirst({
            where: {
                userId,
                pollOption: {
                    pollId: parseInt(pollId)
                }
            }
        });

        if (existingVote) {
            // If user has already voted, update their vote
            await prisma.pollVote.update({
                where: { id: existingVote.id },
                data: {
                    pollOptionId: parseInt(optionId)
                }
            });
        } else {
            // Create new vote if user hasn't voted yet
            await prisma.pollVote.create({
                data: {
                    userId,
                    pollOptionId: parseInt(optionId)
                }
            });
        }

        // Get updated vote counts for all options in this poll
        const pollOptions = await prisma.pollOption.findMany({
            where: {
                pollId: parseInt(pollId)
            },
            include: {
                _count: {
                    select: {
                        votes: true
                    }
                }
            }
        });

        const updatedVotes: {[key: number]: number} = {};
        pollOptions.forEach(option => {
            updatedVotes[option.id] = option._count.votes;
        });

        return NextResponse.json({
            message: "Vote recorded successfully",
            updatedVotes
        });

    } catch (error) {
        console.error("Error recording vote:", error);
        return NextResponse.json(
            { error: "Failed to record vote" },
            { status: 500 }
        );
    }
}
