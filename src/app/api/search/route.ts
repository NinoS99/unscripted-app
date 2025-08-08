import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const type = searchParams.get("type");

        if (!query) {
            return NextResponse.json({ shows: [] });
        }

        let shows;

        if (type === "id") {
            // Search by ID
            const showId = parseInt(query);
            if (isNaN(showId)) {
                return NextResponse.json({ shows: [] });
            }

            const show = await prisma.show.findUnique({
                where: { id: showId },
                select: {
                    id: true,
                    name: true,
                    posterPath: true,
                    firstAirDate: true,
                    tmdbRating: true
                }
            });

            shows = show ? [show] : [];
        } else {
            // Search by name
            if (query.trim().length < 2) {
                return NextResponse.json({ shows: [] });
            }

            shows = await prisma.show.findMany({
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
        }

        return NextResponse.json({ shows });

    } catch (error) {
        console.error("Error searching shows:", error);
        return NextResponse.json(
            { error: "Failed to search shows" },
            { status: 500 }
        );
    }
} 