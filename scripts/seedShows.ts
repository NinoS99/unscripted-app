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

interface EpisodeDetails {
    id: number;
    name: string;
    episode_number: number;
    overview: string | null;
    vote_average: number;
    still_path: string | null;
    air_date: string | null; // Adding air_date field
}

interface NetworkDetails {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
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

  return await prisma.show.create({
    data: {
      tmdbId: showData.id,
      name: showData.name,
      overview: showData.overview,
      firstAirDate: new Date(showData.first_air_date),
      originCountry: showData.origin_country,
      originalLanguage: originalLanguage,
      posterPath: showData.poster_path ?? null,
      backdropPath: showData.backdrop_path ?? null,
      tagline: showData.tagline || '',
      tmdbRating: showData.vote_average,
      isRunning: showData.next_episode_to_air !== null,
    },
  });
}


// Function to create a season
async function createSeason(showId: number, season: any) {
    return await prisma.season.create({
        data: {
            showId: showId,
            seasonNumber: season.season_number,
            episodeCount: season.episode_count,
            overview: season.overview,
            posterPath: season.poster_path ? season.poster_path : null,
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
            stillPath: episode.still_path ? episode.still_path : null,
            airDate: episode.air_date ? new Date(episode.air_date) : null, // Store the air date as a Date
            seasonId: seasonId, // Link the episode to the season using the season ID
        })),
    });
}

async function findOrCreateNetwork(network: NetworkDetails) {
  return await prisma.network.upsert({
    where: { id: network.id },
    update: {
      name: network.name,
      logoPath: network.logo_path ?? null,
      originCountry: network.origin_country ?? 'Unknown',
    },
    create: {
      id: network.id,
      name: network.name,
      logoPath: network.logo_path ?? null,
      originCountry: network.origin_country ?? 'Unknown',
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

                // Fetch the episodes for the season
                const seasonDetails = (await fetch(
                    `https://api.themoviedb.org/3/tv/${show.id}/season/${season.season_number}?api_key=${API_KEY}`
                ).then((res) => res.json())) as SeasonDetails;

                // Create episodes for the season
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
