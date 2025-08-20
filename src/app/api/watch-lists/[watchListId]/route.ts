import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ watchListId: string }> }
) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { watchListId: watchListIdStr } = await params;
        const watchListId = parseInt(watchListIdStr);
        if (isNaN(watchListId)) {
            return NextResponse.json({ error: "Invalid watch list ID" }, { status: 400 });
        }

        // Check if the watch list exists and belongs to the user
        const existingWatchList = await prisma.watchList.findFirst({
            where: {
                id: watchListId,
                userId: userId
            }
        });

        if (!existingWatchList) {
            return NextResponse.json({ error: "Watch list not found" }, { status: 404 });
        }

        const body = await request.json();
        const {
            name,
            description,
            tags,
            isPublic,
            friendsOnly,
            isRanked,
            shows
        } = body;

        if (!name || !shows || shows.length === 0) {
            return NextResponse.json(
                { error: "Name and at least one show are required" },
                { status: 400 }
            );
        }

        // Update the watch list using a transaction
        const updatedWatchList = await prisma.$transaction(async (tx) => {
            // Delete existing shows and tags
            await tx.watchListShow.deleteMany({
                where: { watchListId }
            });
            
            await tx.watchListTag.deleteMany({
                where: { watchListId }
            });

            // Update the watch list
            const watchList = await tx.watchList.update({
                where: { id: watchListId },
                data: {
                    name,
                    description,
                    isPublic,
                    friendsOnly,
                    shows: {
                        create: shows.map((show: { 
                            showId: number; 
                            ranking?: number; 
                            note?: string; 
                            spoiler?: boolean; 
                            muchWatchSeasons?: number[] 
                        }, index: number) => ({
                            showId: show.showId,
                            ranking: show.ranking || (isRanked ? index + 1 : null),
                            note: show.note,
                            spoiler: show.spoiler || false,
                            muchWatchSeasons: show.muchWatchSeasons && show.muchWatchSeasons.length > 0 ? {
                                create: show.muchWatchSeasons.map((seasonId: number) => ({
                                    seasonId
                                }))
                            } : undefined
                        }))
                    },
                    tags: tags && tags.length > 0 ? {
                        create: tags.map((tagName: string) => ({
                            tag: {
                                connectOrCreate: {
                                    where: { name: tagName },
                                    create: { name: tagName }
                                }
                            }
                        }))
                    } : undefined
                },
                include: {
                    shows: {
                        include: {
                            show: true
                        }
                    },
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                }
            });

            return watchList;
        });

        return NextResponse.json({
            watchListId: updatedWatchList.id,
            message: "Watch list updated successfully"
        });

    } catch (error) {
        console.error("Error updating watch list:", error);
        return NextResponse.json(
            { error: "Failed to update watch list" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ watchListId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { watchListId } = await params;
        const watchListIdNum = parseInt(watchListId);

        if (isNaN(watchListIdNum)) {
            return NextResponse.json({ error: "Invalid watch list ID" }, { status: 400 });
        }

        // Verify the watch list exists and belongs to the user
        const watchList = await prisma.watchList.findFirst({
            where: {
                id: watchListIdNum,
                userId: userId
            }
        });

        if (!watchList) {
            return NextResponse.json({ error: "Watch list not found or unauthorized" }, { status: 404 });
        }

        // Delete the watch list (cascade will handle related records)
        await prisma.watchList.delete({
            where: { id: watchListIdNum }
        });

        return NextResponse.json({ message: "Watch list deleted successfully" });
    } catch (error) {
        console.error("Error deleting watch list:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 