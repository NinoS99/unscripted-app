import { notFound } from "next/navigation";
import prisma from "@/lib/client";
import DiscussionsPage from "@/components/DiscussionsPage";

interface DiscussionsPageProps {
    params: Promise<{
        entityType: string;
        entityId: string;
    }>;
}

export default async function DiscussionsPageServer({
    params,
}: DiscussionsPageProps) {
    const { entityType, entityId } = await params;

    // Validate entity type
    if (!["show", "season", "episode"].includes(entityType)) {
        notFound();
    }

    // Validate entity ID
    const entityIdNum = parseInt(entityId);
    if (isNaN(entityIdNum)) {
        notFound();
    }

    // Fetch entity data based on type
    let entity;
    let entityName: string;
    let availableImages = {};

    try {
        switch (entityType) {
            case "show":
                entity = await prisma.show.findUnique({
                    where: { id: entityIdNum },
                    select: {
                        id: true,
                        name: true,
                        posterPath: true,
                        firstAirDate: true,
                    },
                });
                if (!entity) notFound();
                entityName = entity.name;
                break;

            case "season":
                entity = await prisma.season.findUnique({
                    where: { id: entityIdNum },
                    select: {
                        id: true,
                        seasonNumber: true,
                        airDate: true,
                        posterPath: true,
                        show: {
                            select: {
                                id: true,
                                name: true,
                                posterPath: true,
                            },
                        },
                    },
                });
                if (!entity) notFound();
                entityName = `${entity.show.name} - ${entity.seasonNumber === 0 ? "Specials" : `Season ${entity.seasonNumber}`}`;
                availableImages = {
                    seasonPosterPath: entity.posterPath,
                    showPosterPath: entity.show?.posterPath,
                };
                break;

            case "episode":
                entity = await prisma.episode.findUnique({
                    where: { id: entityIdNum },
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
                if (!entity) notFound();
                entityName = `${entity.season.show.name} - ${entity.season.seasonNumber === 0 ? "S" : `S${entity.season.seasonNumber}E`}${entity.episodeNumber} - ${entity.name}`;
                availableImages = {
                    episodeStillPath: entity.stillPath,
                    seasonPosterPath: entity.season?.posterPath,
                    showPosterPath: entity.season?.show?.posterPath,
                };
                break;

            default:
                notFound();
        }
    } catch (error) {
        console.error("Error fetching entity:", error);
        notFound();
    }

    // Fetch entity data with ratings, favorites, and watched counts
    let entityWithStats;
    const ratingDistribution: { [key: number]: number } = {};
    let totalLikes = 0;
    let totalWatched = 0;

    try {
        switch (entityType) {
            case "show":
                entityWithStats = await prisma.show.findUnique({
                    where: { id: entityIdNum },
                    select: {
                        id: true,
                        name: true,
                        posterPath: true,
                        firstAirDate: true,
                        _count: {
                            select: {
                                favorites: true,
                                watched: true,
                                ratings: true,
                            },
                        },
                        ratings: {
                            select: {
                                rating: true,
                            },
                        },
                    },
                });
                break;

            case "season":
                entityWithStats = await prisma.season.findUnique({
                    where: { id: entityIdNum },
                    select: {
                        id: true,
                        seasonNumber: true,
                        airDate: true,
                        posterPath: true,
                        _count: {
                            select: {
                                favorites: true,
                                watched: true,
                                ratings: true,
                            },
                        },
                        ratings: {
                            select: {
                                rating: true,
                            },
                        },
                        show: {
                            select: {
                                id: true,
                                name: true,
                                posterPath: true,
                            },
                        },
                    },
                });
                break;

            case "episode":
                entityWithStats = await prisma.episode.findUnique({
                    where: { id: entityIdNum },
                    select: {
                        id: true,
                        episodeNumber: true,
                        name: true,
                        stillPath: true,
                        airDate: true,
                        _count: {
                            select: {
                                favorites: true,
                                watched: true,
                                ratings: true,
                            },
                        },
                        ratings: {
                            select: {
                                rating: true,
                            },
                        },
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
                break;
        }

        if (entityWithStats) {
            // Calculate rating distribution from all ratings
            if ('ratings' in entityWithStats && entityWithStats.ratings) {
                entityWithStats.ratings.forEach((rating: { rating: number }) => {
                    ratingDistribution[rating.rating] = (ratingDistribution[rating.rating] || 0) + 1;
                });
            }

            // Get total likes and watched counts
            totalLikes = 'favorites' in entityWithStats._count ? entityWithStats._count.favorites : 0;
            totalWatched = 'watched' in entityWithStats._count ? entityWithStats._count.watched : 0;
        }
    } catch (error) {
        console.error("Error fetching entity stats:", error);
    }

    return (
        <DiscussionsPage
            entityType={entityType as "show" | "season" | "episode"}
            entityId={entityIdNum}
            entityName={entityName}
            entity={entity}
            availableImages={availableImages}
            totalLikes={totalLikes}
            totalWatched={totalWatched}
            ratingDistribution={ratingDistribution}
        />
    );
}
