import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/client";
import { notFound } from "next/navigation";
import ReviewsPage from "@/components/ReviewsPage";

interface ReviewsPageProps {
    params: Promise<{
        entityType: string;
        entityId: string;
    }>;
}

export default async function ReviewsPageServer({ params }: ReviewsPageProps) {
    const { userId } = await auth();
    
    // Redirect if not logged in
    if (!userId) {
        redirect("/sign-in");
    }

    const { entityType, entityId } = await params;

    // Validate review type
    if (!["show", "season", "episode"].includes(entityType)) {
        notFound();
    }

    try {
        let entity;
        let entityName;

        switch (entityType) {
            case "show":
                entity = await prisma.show.findUnique({
                    where: { id: parseInt(entityId) },
                    select: {
                        id: true,
                        name: true,
                        posterPath: true,
                        firstAirDate: true,
                    },
                });
                entityName = entity?.name;
                break;

            case "season":
                entity = await prisma.season.findUnique({
                    where: { id: parseInt(entityId) },
                    select: {
                        id: true,
                        seasonNumber: true,
                        posterPath: true,
                        airDate: true,
                        show: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                });
                entityName = entity ? `${entity.show.name} - Season ${entity.seasonNumber}` : null;
                break;

            case "episode":
                entity = await prisma.episode.findUnique({
                    where: { id: parseInt(entityId) },
                    select: {
                        id: true,
                        episodeNumber: true,
                        name: true,
                        stillPath: true,
                        airDate: true,
                        season: {
                            select: {
                                id: true,
                                seasonNumber: true,
                                show: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                });
                entityName = entity ? `${entity.season.show.name} - S${entity.season.seasonNumber}E${entity.episodeNumber} - ${entity.name}` : null;
                break;
        }

        if (!entity) {
            notFound();
        }

        return (
            <ReviewsPage
                entityType={entityType as "show" | "season" | "episode"}
                entityId={parseInt(entityId)}
                entityName={entityName || "Unknown"}
                entity={entity}
            />
        );
    } catch (error) {
        console.error("Error fetching entity:", error);
        notFound();
    }
} 