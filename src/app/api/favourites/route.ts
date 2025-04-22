import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { showId } = await req.json();

        // Check if favorite already exists
        const existingFavorite = await prisma.favorite.findFirst({
            where: {
                userId,
                showId: Number(showId),
            },
        });

        if (existingFavorite) {
            return NextResponse.json({
                isFavorite: true,
                favorite: existingFavorite,
            });
        }

        // Create new favorite and return it
        const favorite = await prisma.favorite.create({
            data: {
                userId,
                showId: Number(showId),
            },
            include: {
                show: {
                    select: {
                        id: true,
                        name: true,
                        posterPath: true,
                    },
                },
            },
        });

        return NextResponse.json({
            isFavorite: true,
            favorite: {
                id: favorite.id,
                show: favorite.show,
            },
        });
    } catch (error) {
        console.error("Error creating favorite:", error);
        return NextResponse.json(
            { error: "Failed to create favorite" },
            { status: 500 }
        );
    }
}
export async function DELETE(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { showId } = await req.json();

        if (!showId) {
            return NextResponse.json(
                { error: "showId is required" },
                { status: 400 }
            );
        }

        // Delete favorite
        await prisma.favorite.deleteMany({
            where: {
                userId,
                showId: Number(showId),
            },
        });

        return NextResponse.json({ isFavorite: false });
    } catch (error) {
        console.error("Error deleting favorite:", error);
        return NextResponse.json(
            { error: "Failed to delete favorite" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const showId = searchParams.get("showId");

        if (!showId) {
            return NextResponse.json(
                { error: "showId is required" },
                { status: 400 }
            );
        }

        const favorite = await prisma.favorite.findFirst({
            where: {
                userId,
                showId: Number(showId),
            },
        });

        return NextResponse.json({ isFavorite: !!favorite });
    } catch (error) {
        console.error("Error checking favorite:", error);
        return NextResponse.json(
            { error: "Failed to check favorite status" },
            { status: 500 }
        );
    }
}
