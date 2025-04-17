import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const API_KEY = process.env.TMDB_API_KEY; // Make sure you have your TMDB API key

// Define types for the API response data
interface ShowDetails {
    id: number;
    name: string;
    tagline: string | null;
    vote_average: number;
    first_air_date: string;
    overview: string | null;
    origin_country: string[];
    original_language: string[];
    poster_path: string | null;
    backdrop_path: string | null;
    created_by: CreatorDetails[];
    next_episode_to_air: any; // Refine this based on actual API data, or remove if not needed
    networks: Array<{
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string | null;
    }>;
    seasons: Array<{
        id: number;
        season_number: number;
        episode_count: number;
        poster_path: string | null;
        vote_average: number;
    }>;
}

interface DiscoverResponse {
    results: Array<{
        id: number;
        name: string;
        first_air_date: string;
        overview: string | null;
        poster_path: string | null;
    }>;
}

interface SeasonDetails {
    id: number;
    season_number: number;
    episode_count: number;
    overview: string;
    air_date: string;
    poster_path: string | null;
    vote_average: number;
    episodes: Array<{
        id: number;
        name: string;
        episode_number: number;
        overview: string | null;
        vote_average: number;
        still_path: string | null;
        air_date: string | null; // Adding air_date field
    }>;
}

interface CreatorDetails {
    id: number;
    name: string;
    original_name: string;
    profile_path: string | null;
}

interface NetworkDetails {
    id: number;
    name: string;
    homepage: string;
    logo_path: string | null;
    origin_country: string;
}

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

function safePath(path: any): string | null {
    if (typeof path !== "string") return null;

    const trimmed = path.trim().toLowerCase();
    if (trimmed === "" || trimmed === "null" || trimmed === "[null]")
        return null;

    return path;
}

// Function to fetch show details
async function getShowDetails(tmdbId: number): Promise<ShowDetails> {
    const response = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data as ShowDetails;
}

// Function to create a show
async function createShow(showData: ShowDetails) {
    const originalLanguage = Array.isArray(showData.original_language)
        ? showData.original_language
        : [showData.original_language];

    const show = await prisma.show.create({
        data: {
            tmdbId: showData.id,
            name: showData.name,
            overview: showData.overview,
            firstAirDate:
                showData.first_air_date && showData.first_air_date !== "null"
                    ? new Date(showData.first_air_date)
                    : null,
            originCountry: showData.origin_country,
            originalLanguage: originalLanguage,
            posterPath: safePath(showData.poster_path),
            backdropPath: showData.backdrop_path ?? null,
            tagline: showData.tagline || "",
            tmdbRating: showData.vote_average,
            isRunning: showData.next_episode_to_air !== null,
        },
    });

    // Process creators if they exist
    if (showData.created_by && showData.created_by.length > 0) {
        for (const creator of showData.created_by) {
            const dbCreator = await findOrCreateCreator(creator);
            await prisma.showCreator.create({
                data: {
                    showId: show.id,
                    creatorId: dbCreator.id,
                },
            });
        }
    }

    return show;
}

// Function to create a season
async function createSeason(showId: number, season: any) {
    return await prisma.season.create({
        data: {
            showId: showId,
            seasonNumber: season.season_number,
            episodeCount: season.episode_count,
            airDate:
                season.air_date && season.air_date !== "null"
                    ? new Date(season.air_date)
                    : null,
            overview: season.overview,
            posterPath: safePath(season.poster_path),
            tmdbRating: season.vote_average,
        },
    });
}

// Function to create episodes for a season
async function createEpisodes(seasonId: number, episodes: any[]) {
    return await prisma.episode.createMany({
        data: episodes.map((episode) => ({
            episodeNumber: episode.episode_number,
            name: episode.name,
            overview: episode.overview,
            tmdbRating: episode.vote_average,
            stillPath: safePath(episode.still_path),
            airDate:
                episode.air_date && episode.air_date !== "null"
                    ? new Date(episode.air_date)
                    : null,
            seasonId: seasonId, // Link the episode to the season using the season ID
        })),
    });
}

async function getSeasonCredits(
    showId: number,
    seasonNumber: number
): Promise<CreditDetails> {
    const response = await fetch(
        `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}/credits?api_key=${API_KEY}`
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch credits for season ${seasonNumber}`);
    }
    return (await response.json()) as CreditDetails;
}

async function findOrCreateNetwork(network: NetworkDetails) {
    const existingNetwork = await prisma.network.findUnique({
        where: { id: network.id },
    });

    if (existingNetwork) {
        return existingNetwork;
    }

    // Fetch additional network details from TMDB API
    const response = await fetch(
        `https://api.themoviedb.org/3/network/${network.id}?api_key=${API_KEY}`
    );

    if (!response.ok) {
        console.error(`Failed to fetch network with ID ${network.id}`);
        return await prisma.network.create({
            data: {
                id: network.id,
                name: network.name,
                homepage: "",
                logoPath: network.logo_path ?? null,
                originCountry: network.origin_country ?? "Unknown",
            },
        });
    }

    const networkDetails = (await response.json()) as NetworkDetails;

    return await prisma.network.create({
        data: {
            id: networkDetails.id,
            name: networkDetails.name,
            homepage: networkDetails.homepage ?? "",
            logoPath: networkDetails.logo_path ?? null,
            originCountry: networkDetails.origin_country ?? "Unknown",
        },
    });
}

async function findOrCreatePerson(personData: {
    id: number;
    name: string;
    original_name: string;
    profile_path: string | null;
}) {
    const existing = await prisma.person.findUnique({
        where: { id: personData.id },
    });

    if (existing) return existing;

    return await prisma.person.create({
        data: {
            id: personData.id,
            name: personData.name,
            profilePath: safePath(personData.profile_path),
        },
    });
}

async function createCharacters(seasonId: number, credits: CreditDetails) {
    const mainCast = credits.cast.filter(
        (person) => person.name && person.order < 10
    );

    for (const person of mainCast) {
        const dbPerson = await findOrCreatePerson({
            id: person.id,
            name: person.name,
            original_name: person.original_name,
            profile_path: person.profile_path,
        });

        await prisma.character.create({
            data: {
                seasonId,
                personId: dbPerson.id,
                showRole: person.character || null,
            },
        });
    }
}

async function findOrCreateCreator(creator: CreatorDetails) {
    const existingCreator = await prisma.creator.findUnique({
        where: { id: creator.id },
    });

    if (existingCreator) {
        return existingCreator;
    }

    return await prisma.creator.create({
        data: {
            id: creator.id,
            name: creator.name,
            originalName: creator.original_name,
            profilePath: safePath(creator.profile_path),
        },
    });
}

// Main seeding function
async function seedShows() {
    let page = 1;
    let showsInserted = 0;

    // Iterate through pages of show data and insert shows up to 100
    while (showsInserted < 20) {
        const response = await fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=en-US&first_air_date.gte=2010-01-01&with_origin_country=US&original_language='en'&with_genres=10764&sort_by=popularity.desc&page=${page}`
        );

        const data = (await response.json()) as DiscoverResponse;

        if (!data.results || data.results.length === 0) break; // No more shows to fetch

        for (const show of data.results) {
            const existingShow = await prisma.show.findUnique({
                where: {
                    tmdbId: show.id,
                },
            });

            if (existingShow) {
                console.log(
                    `Skipping show: ${show.name} (ID: ${show.id}), already exists in the database.`
                );
                continue;
            }

            const showDetails = await getShowDetails(show.id);

            // Process networks
            const connectedNetworks = [];

            for (const net of showDetails.networks as NetworkDetails[]) {
                const dbNetwork = await findOrCreateNetwork(net);
                connectedNetworks.push({ id: dbNetwork.id });
            }

            // Create the show with linked networks
            const createdShow = await createShow(showDetails);

            // Create entries in ShowsOnNetworks table
            for (const { id: networkId } of connectedNetworks) {
                await prisma.showsOnNetworks.create({
                    data: {
                        showId: createdShow.id,
                        networkId: networkId,
                    },
                });
            }

            // Loop through seasons and create them
            for (const season of showDetails.seasons) {
                const createdSeason = await createSeason(
                    createdShow.id,
                    season
                );

                // Fetch season credits and create characters
                try {
                    const credits = await getSeasonCredits(
                        show.id,
                        season.season_number
                    );
                    await createCharacters(createdSeason.id, credits);
                } catch (error) {
                    console.error(
                        `Failed to get credits for season ${season.season_number}:`,
                        error
                    );
                }

                // Rest of your existing season/episode logic...
                const seasonDetails = (await fetch(
                    `https://api.themoviedb.org/3/tv/${show.id}/season/${season.season_number}?api_key=${API_KEY}`
                ).then((res) => res.json())) as SeasonDetails;

                await createEpisodes(createdSeason.id, seasonDetails.episodes);
            }

            showsInserted++;

            if (showsInserted >= 20) {
                console.log("Inserted 20 shows, stopping...");
                break;
            }
        }

        page++;
    }

    console.log("Seeding completed!");
}

// Run the seeding process
seedShows()
    .catch((error) => {
        console.error("Error seeding the shows:", error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
