import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { userId } = await auth();
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!query) {
            return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
        }

        // Get user by username
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Search user's watch lists
        const watchLists = await prisma.watchList.findMany({
            where: {
                userId: user.id,
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        description: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                isPublic: true,
                friendsOnly: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ watchLists });
    } catch (error) {
        console.error("Error searching watch lists:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 