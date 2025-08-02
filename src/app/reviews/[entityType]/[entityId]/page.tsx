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
    // Allow public access to view reviews

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
                                posterPath: true,
                            },
                        },
                    },
                });
                entityName = entity ? `${entity.show.name} - ${entity.seasonNumber === 0 ? "Specials" : `Season ${entity.seasonNumber}`}` : null;
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
                                posterPath: true,
                                show: {
                                    select: {
                                        id: true,
                                        name: true,
                                        posterPath: true,
                                    },
                                },
                            },
                        },
                    },
                });
                entityName = entity ? `${entity.season.show.name} - ${entity.season.seasonNumber === 0 ? "S" : `S${entity.season.seasonNumber}E`}${entity.episodeNumber} - ${entity.name}` : null;
                break;
        }

        if (!entity) {
            notFound();
        }

        // Construct availableImages object for fallback logic
        let availableImages = {};
        if (entityType === "season" && 'show' in entity) {
            availableImages = {
                seasonPosterPath: entity.posterPath,
                showPosterPath: entity.show?.posterPath,
            };
        } else if (entityType === "episode" && 'season' in entity) {
            availableImages = {
                episodeStillPath: entity.stillPath,
                seasonPosterPath: entity.season?.posterPath,
                showPosterPath: entity.season?.show?.posterPath,
            };
        }

        return (
            <ReviewsPage
                entityType={entityType as "show" | "season" | "episode"}
                entityId={parseInt(entityId)}
                entityName={entityName || "Unknown"}
                entity={entity}
                availableImages={availableImages}
            />
        );
    } catch (error) {
        console.error("Error fetching entity:", error);
        notFound();
    }
} 