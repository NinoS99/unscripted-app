import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const API_KEY = process.env.TMDB_API_KEY;

interface ShowDetails {
  id: number;
  name: string;
  tagline: string | null;
  vote_average: number;
  first_air_date: string;
  overview: string | null;
  origin_country: string[];
  original_language: string[] | string;
  poster_path: string | null;
  backdrop_path: string | null;
  created_by: CreatorDetails[];
  next_episode_to_air: {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    season_number: number;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
  } | null;
  networks: NetworkDetails[];
  seasons: Array<{
    id: number;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    vote_average: number;
    air_date: string | null;
    overview: string;
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
    air_date: string | null;
    guest_stars: Array<{
      id: number;
      name: string;
      original_name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }>;
  }>;
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

interface DiscoverResponse {
  results: Array<{
    id: number;
    name: string;
    first_air_date: string;
    overview: string | null;
    poster_path: string | null;
  }>;
}

interface KeywordResponse {
  results: Array<{
    id: number;
    name: string;
  }>;
}

// Competition-related keywords to search for
const COMPETITION_KEYWORDS = [
  'competition',
  'contest',
  'voting',
  'elimination',
  'reality competition',
  'game show',
  'talent show',
  'singing competition',
  'cooking competition',
  'dating show',
  'reality tv',
  'elimination challenge',
  'immunity challenge',
  'finale',
  'winner',
  'prize',
  'judges',
  'audition',
  'battle',
  'challenge',
  'tournament',
  'race',
  'public vote',
  'viewer voting',
  'dance competition',
  'performance',
  'talent competition',
  'skill competition',
  'business competition',
  'design competition',
  'fashion competition',
  'pageant',
  'beauty contest',
  'sports competition',
  'athletic competition',
  'physical challenge',
  'tribal council',
  'rose ceremony',
  'elimination ceremony'
];

// Show type keywords for classification
const SHOW_TYPE_KEYWORDS = {
  talent: [
    'talent show',
    'singing competition',
    'dance competition',
    'performance',
    'judges',
    'audition',
    'talent competition',
    'skill competition',
    'pageant',
    'beauty contest'
  ],
  dating: [
    'dating show',
    'rose ceremony',
    'bachelor',
    'bachelorette',
    'love',
    'romance',
    'relationship'
  ],
  survival: [
    'survivor',
    'tribal council',
    'immunity',
    'survival',
    'island',
    'wilderness',
    'stranded',
    'outlast'
  ],
  competition: [
    'game show',
    'contest',
    'tournament',
    'championship',
    'elimination challenge',
    'battle',
    'race',
    'public vote',
    'viewer voting'
  ]
};


function safePath(path: string | null | undefined): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim().toLowerCase();
  return trimmed === "" || trimmed === "null" || trimmed === "[null]"
    ? null
    : path;
}

async function getShowDetails(tmdbId: number): Promise<ShowDetails> {
  const response = await fetch(
    `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${API_KEY}`
  );
  const data = await response.json();
  return data as ShowDetails;
}

/**
 * Fetches keywords for a show from TMDB API
 */
async function getShowKeywords(tmdbId: number): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/keywords?api_key=${API_KEY}`
    );
    
    if (!response.ok) {
      console.warn(`Failed to fetch keywords for show ${tmdbId}: ${response.status}`);
      return [];
    }
    
    const data = await response.json() as KeywordResponse;
    return data.results?.map(keyword => keyword.name.toLowerCase()) || [];
  } catch (error) {
    console.error(`Error fetching keywords for show ${tmdbId}:`, error);
    return [];
  }
}

/**
 * Determines if a show is a competition show based on its keywords
 */
function isCompetitionShow(keywords: string[]): boolean {
  const keywordString = keywords.join(' ').toLowerCase();
  
  return COMPETITION_KEYWORDS.some(competitionKeyword => 
    keywordString.includes(competitionKeyword.toLowerCase())
  );
}

/**
 * Determines the specific show type for competition shows
 */
function determineShowType(keywords: string[]): string | null {
  const keywordString = keywords.join(' ').toLowerCase();
  
  // Check each type in order of specificity
  for (const [type, typeKeywords] of Object.entries(SHOW_TYPE_KEYWORDS)) {
    if (typeKeywords.some(keyword => keywordString.includes(keyword))) {
      return type;
    }
  }
  
  // Default to 'competition' if it has competition keywords but no specific type
  return isCompetitionShow(keywords) ? 'competition' : null;
}

async function getSeasonCredits(
  showId: number,
  seasonNumber: number
): Promise<CreditDetails> {
  const response = await fetch(
    `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}/credits?api_key=${API_KEY}`
  );
  if (!response.ok) throw new Error("Failed to fetch credits");
  const data = await response.json();
return data as CreditDetails;
}

async function createShow(showData: ShowDetails) {
  const originalLanguage = Array.isArray(showData.original_language)
    ? showData.original_language
    : [showData.original_language];

  // Get keywords to determine if it's a competition show and its type
  console.log(`  Checking if ${showData.name} is a competition show...`);
  const keywords = await getShowKeywords(showData.id);
  const isCompetition = isCompetitionShow(keywords);
  const showType = isCompetition ? determineShowType(keywords) : null;
  
  if (isCompetition && keywords.length > 0) {
    console.log(`    ✓ Detected as competition show (${showType}). Keywords: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`);
  }

  const show = await prisma.show.create({
    data: {
      tmdbId: showData.id,
      name: showData.name,
      overview: showData.overview || null,
      firstAirDate:
        showData.first_air_date && showData.first_air_date !== "null"
          ? new Date(showData.first_air_date)
          : null,
      originCountry: showData.origin_country,
      originalLanguage,
      posterPath: safePath(showData.poster_path),
      backdropPath: showData.backdrop_path ?? null,
      tagline: showData.tagline || null,
      tmdbRating: showData.vote_average,
      isRunning: showData.next_episode_to_air !== null,
      isCompetition: isCompetition,
      showType: showType,
    },
  });

  for (const creator of showData.created_by) {
    const dbCreator = await findOrCreateCreator(creator);
    await prisma.showCreator.create({
      data: {
        showId: show.id,
        creatorId: dbCreator.id,
      },
    });
  }

  return show;
}

async function createSeason(showId: number, season: {
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string;
  poster_path: string | null;
  vote_average: number;
}) {
  return await prisma.season.create({
    data: {
      showId,
      seasonNumber: season.season_number,
      episodeCount: season.episode_count,
      airDate:
        season.air_date && season.air_date !== "null"
          ? new Date(season.air_date)
          : null,
      overview: season.overview || null,
      posterPath: safePath(season.poster_path),
      tmdbRating: season.vote_average,
    },
  });
}

async function createEpisodes(seasonId: number, episodes: Array<{
  episode_number: number;
  name: string;
  overview: string | null;
  vote_average: number;
  still_path: string | null;
  air_date: string | null;
}>) {
  return await prisma.episode.createMany({
    data: episodes.map((ep) => ({
      episodeNumber: ep.episode_number,
      name: ep.name,
      overview: ep.overview || null,
      tmdbRating: ep.vote_average,
      stillPath: safePath(ep.still_path),
      airDate:
        ep.air_date && ep.air_date !== "null"
          ? new Date(ep.air_date)
          : null,
      seasonId,
    })),
  });
}

async function createCharacters(
  seasonId: number,
  credits: CreditDetails,
  episodes: SeasonDetails["episodes"]
) {
  const processedPersonIds = new Set<number>();

  // Add main cast
  for (const person of credits.cast) {
    if (!person.name || processedPersonIds.has(person.id)) continue;

    const dbPerson = await findOrCreatePerson(person);
    await prisma.character.create({
      data: {
        seasonId,
        personId: dbPerson.id,
        showRole: person.character || null,
      },
    });

    processedPersonIds.add(person.id);
  }

  // Add guest stars
  for (const episode of episodes) {
    for (const guest of episode.guest_stars) {
      if (!guest.name || processedPersonIds.has(guest.id)) continue;

      const dbPerson = await findOrCreatePerson(guest);
      await prisma.character.create({
        data: {
          seasonId,
          personId: dbPerson.id,
          showRole: guest.character || null,
        },
      });

      processedPersonIds.add(guest.id);
    }
  }
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

async function findOrCreateCreator(creator: CreatorDetails) {
  const existingCreator = await prisma.creator.findUnique({
    where: { id: creator.id },
  });

  if (existingCreator) return existingCreator;

  return await prisma.creator.create({
    data: {
      id: creator.id,
      name: creator.name,
      originalName: creator.original_name,
      profilePath: safePath(creator.profile_path),
    },
  });
}

async function findOrCreateNetwork(network: NetworkDetails) {
  const existingNetwork = await prisma.network.findUnique({
    where: { id: network.id },
  });

  if (existingNetwork) return existingNetwork;

  const response = await fetch(
    `https://api.themoviedb.org/3/network/${network.id}?api_key=${API_KEY}`
  );

  const networkDetails = response.ok
    ? await response.json() as NetworkDetails
    : { ...network, homepage: "" };

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

async function seedShows() {
  let page = 1;
  let showsInserted = 0;

  while (showsInserted < 20) {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=en-US&first_air_date.gte=2010-01-01&with_origin_country=US&original_language='en'&with_genres=10764&sort_by=popularity.desc&page=${page}`
    );
    const data = (await response.json()) as DiscoverResponse;

    if (!data.results || data.results.length === 0) break;

    for (const show of data.results) {
      const exists = await prisma.show.findUnique({ where: { tmdbId: show.id } });
      if (exists) continue;

      console.log(`Processing ${show.name}...`);
      const showDetails = await getShowDetails(show.id);
      const createdShow = await createShow(showDetails);
      
      // Small delay after keywords API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const connectedNetworks = await Promise.all(
        showDetails.networks.map(findOrCreateNetwork)
      );

      for (const network of connectedNetworks) {
        await prisma.showsOnNetworks.create({
          data: { showId: createdShow.id, networkId: network.id },
        });
      }

      for (const season of showDetails.seasons) {
        const createdSeason = await createSeason(createdShow.id, season);

        try {
          const seasonRes = await fetch(
            `https://api.themoviedb.org/3/tv/${show.id}/season/${season.season_number}?api_key=${API_KEY}`
          );
          const seasonDetails = (await seasonRes.json()) as SeasonDetails;

          const credits = await getSeasonCredits(show.id, season.season_number);

          await createCharacters(createdSeason.id, credits, seasonDetails.episodes);
          await createEpisodes(createdSeason.id, seasonDetails.episodes);
        } catch (err) {
          console.error(`Error processing season ${season.season_number}`, err);
        }
      }

      showsInserted++;
      if (showsInserted >= 20) break;
    }

    page++;
  }

  console.log("Seeding completed!");
}

seedShows()
  .catch((err) => {
    console.error("Error seeding shows:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
