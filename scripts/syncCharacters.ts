import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const API_KEY = process.env.TMDB_API_KEY;

interface CreditDetails {
    cast: Array<{
        id: number;
        name: string;
        original_name: string;
        character: string;
        profile_path: string | null;
        order: number;
    }>;
}

interface GuestStar {
    id: number;
    name: string;
    original_name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

interface Episode {
    id: number;
    episode_number: number;
}

async function getSeasonCredits(
    showId: number,
    seasonNumber: number
): Promise<CreditDetails> {
    const res = await fetch(
        `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}/credits?api_key=${API_KEY}`
    );
    if (!res.ok)
        throw new Error(
            `Failed to fetch season credits for show ${showId}, season ${seasonNumber}`
        );
    const data = await res.json();
    return data as CreditDetails;
}

async function getSeasonEpisodes(
    showId: number,
    seasonNumber: number
): Promise<Episode[]> {
    const res = await fetch(
        `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}`
    );
    if (!res.ok)
        throw new Error(
            `Failed to fetch episodes for show ${showId}, season ${seasonNumber}`
        );
    const season = (await res.json()) as { episodes: Episode[] };
    return season.episodes;
}

async function getGuestStars(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
): Promise<GuestStar[]> {
    const res = await fetch(
        `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${API_KEY}`
    );
    if (!res.ok)
        throw new Error(
            `Failed to fetch episode guest stars for S${seasonNumber}E${episodeNumber}`
        );
    const episode = (await res.json()) as { guest_stars: GuestStar[] };
    return episode.guest_stars || [];
}

function safePath(path: string | null | undefined): string | null {
    if (typeof path !== "string") return null;
    const trimmed = path.trim().toLowerCase();
    return trimmed === "" || trimmed === "null" || trimmed === "[null]"
        ? null
        : path;
}

async function findOrCreatePerson(person: GuestStar) {
    let existing = await prisma.person.findUnique({ where: { id: person.id } });
    if (!existing) {
        existing = await prisma.person.create({
            data: {
                id: person.id,
                name: person.name,
                profilePath: safePath(person.profile_path),
            },
        });
    }
    return existing;
}

async function characterExists(seasonId: number, personId: number) {
    const character = await prisma.character.findFirst({
        where: { seasonId, personId },
    });
    return !!character;
}

async function syncCharacters() {
    const shows = await prisma.show.findMany({
        include: {
            seasons: true,
        },
    });

    for (const show of shows) {
        console.log(`Processing ${show.name} - ${show.tmdbId}`);
        for (const season of show.seasons) {
            console.log(
                `Processing ${show.name} - Season ${season.seasonNumber}`
            );

            const [credits, episodes] = await Promise.all([
                getSeasonCredits(show.tmdbId, season.seasonNumber),
                getSeasonEpisodes(show.tmdbId, season.seasonNumber),
            ]);

            const processedPersonIds = new Set<number>();

            // Main cast
            for (const person of credits.cast) {
                if (!person.name || processedPersonIds.has(person.id)) continue;
                const alreadyExists = await characterExists(
                    season.id,
                    person.id
                );
                if (alreadyExists) continue;

                const dbPerson = await findOrCreatePerson(person);
                await prisma.character.create({
                    data: {
                        seasonId: season.id,
                        personId: dbPerson.id,
                        showRole: person.character || null,
                    },
                });

                processedPersonIds.add(person.id);
            }

            // Guest stars
        
            for (const ep of episodes) {
                const guests = await getGuestStars(
                    show.tmdbId,
                    season.seasonNumber,
                    ep.episode_number
                );
                for (const guest of guests) {
                    if (!guest.name || processedPersonIds.has(guest.id))
                        continue;
                    const alreadyExists = await characterExists(
                        season.id,
                        guest.id
                    );
                    if (alreadyExists) continue;

                    const dbPerson = await findOrCreatePerson(guest);
                    await prisma.character.create({
                        data: {
                            seasonId: season.id,
                            personId: dbPerson.id,
                            showRole: guest.character || null,
                        },
                    });

                    processedPersonIds.add(guest.id);
                }
            }

            console.log(`Finished Season ${season.seasonNumber}`);
        }
    }

    console.log("Character sync complete!");
}

syncCharacters()
    .catch((err) => {
        console.error("Error syncing characters:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
