import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

type EntityType = 'show' | 'season' | 'episode' | 'character'

export async function GET(request: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') as EntityType
    const entityId = Number(searchParams.get('entityId'))

    if (!entityType || !entityId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    try {
        const favorite = await prisma.favorite.findFirst({
            where: {
                userId,
                [`${entityType}Id`]: entityId
            }
        })

        return NextResponse.json({ isFavorite: !!favorite })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch favorite status. Error: ' + error},
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { entityType, entityId } = await request.json()

        // Validate input
        if (!['show', 'season', 'episode', 'character'].includes(entityType)) {
            return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
        }

        // Create the favorite record
        const favorite = await prisma.favorite.create({
            data: {
                userId,
                [`${entityType}Id`]: entityId
            }
        })

        return NextResponse.json({ favorite, isFavorite: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create favorite. Error: ' + error},
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { entityType, entityId } = await request.json()

        // Validate input
        if (!['show', 'season', 'episode', 'character'].includes(entityType)) {
            return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
        }

        // Delete the favorite record
        await prisma.favorite.deleteMany({
            where: {
                userId,
                [`${entityType}Id`]: entityId
            }
        })

        return NextResponse.json({ isFavorite: false })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to remove favorite Error: ' + error},
            { status: 500 }
        )
    }
}