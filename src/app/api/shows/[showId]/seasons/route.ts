import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/client";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    try {
        const { showId: showIdParam } = await params;
        const showId = Number(showIdParam);
        
        if (isNaN(showId)) {
            return NextResponse.json({ error: "Invalid show ID" }, { status: 400 });
        }

        const seasons = await prisma.season.findMany({
            where: {
                showId: showId,
            },
            select: {
                id: true,
                seasonNumber: true,
            },
            orderBy: {
                seasonNumber: 'asc',
            },
        });

        return NextResponse.json({ seasons });
    } catch (error) {
        console.error("Error fetching seasons:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 