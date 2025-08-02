import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ shows: [] });
        }

        const shows = await prisma.show.findMany({
            where: {
                name: {
                    contains: query.trim(),
                    mode: "insensitive"
                }
            },
            select: {
                id: true,
                name: true,
                posterPath: true,
                firstAirDate: true,
                tmdbRating: true
            },
            take: 10,
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json({ shows });

    } catch (error) {
        console.error("Error searching shows:", error);
        return NextResponse.json(
            { error: "Failed to search shows" },
            { status: 500 }
        );
    }
} 