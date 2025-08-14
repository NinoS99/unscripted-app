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

interface ShowWithRelations {
  id: number;
  name: string;
  tmdbId: number;
  lastCheckedForUpdate?: {
    lastChecked: Date;
  } | null;
  seasons: Array<{
    id: number;
    seasonNumber: number;
    episodes: Array<{
      airDate: Date | null;
      episodeNumber: number;
    }>;
  }>;
}

interface SeasonWithRelations {
  id: number;
  seasonNumber: number;
}

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

function shouldCheckForUpdates(show: ShowWithRelations, lastChecked: Date | null): boolean {
  const now = new Date();
  
  // If never checked, always check
  if (!lastChecked) return true;
  
  // Get the latest episode by episode number
  const latestEpisode = show.seasons
    ?.flatMap((season) => season.episodes || [])
    ?.sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0))[0];
  
  const latestEpisodeAirDate = latestEpisode?.airDate || null;
  
  // If no air date or air date is less than a year ago, check every run
  if (!latestEpisodeAirDate || (latestEpisodeAirDate && (now.getTime() - latestEpisodeAirDate.getTime()) < 365 * 24 * 60 * 60 * 1000)) {
    return true;
  }
  
  // For shows with latest episode more than a year ago, check every 3 days
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  return lastChecked < threeDaysAgo;
}

async function updateShow(show: ShowWithRelations, showData: ShowDetails) {
  const originalLanguage = Array.isArray(showData.original_language)
    ? showData.original_language
    : [showData.original_language];

  // Get current show data for comparison
  const currentShow = await prisma.show.findUnique({
    where: { id: show.id },
    select: {
      name: true,
      overview: true,
      firstAirDate: true,
      originCountry: true,
      originalLanguage: true,
      posterPath: true,
      backdropPath: true,
      tagline: true,
      tmdbRating: true,
      isRunning: true,
    },
  });

  // Update show details
  await prisma.show.update({
    where: { id: show.id },
    data: {
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
    },
  });

  let hasChanges = false;

  // Log show field updates
  if (currentShow) {
    // Helper function to normalize dates for comparison
    const normalizeDate = (date: Date | string | null): string | null => {
      if (!date) return null;
      if (typeof date === 'string') {
        // If it's already a date string, extract just the date part
        return date.split('T')[0];
      }
      // If it's a Date object, convert to date string
      return date.toISOString().split('T')[0];
    };

    const fieldUpdates = [
      { field: "name", old: currentShow.name, new: showData.name },
      { field: "overview", old: currentShow.overview, new: showData.overview || null },
      { field: "firstAirDate", old: normalizeDate(currentShow.firstAirDate), new: normalizeDate(showData.first_air_date) },
      { field: "originCountry", old: JSON.stringify(currentShow.originCountry), new: JSON.stringify(showData.origin_country) },
      { field: "originalLanguage", old: JSON.stringify(currentShow.originalLanguage), new: JSON.stringify(originalLanguage) },
      { field: "posterPath", old: currentShow.posterPath || null, new: safePath(showData.poster_path) },
      { field: "backdropPath", old: currentShow.backdropPath || null, new: showData.backdrop_path || null },
      { field: "tagline", old: currentShow.tagline, new: showData.tagline || null },
      { field: "tmdbRating", old: currentShow.tmdbRating?.toString() || null, new: showData.vote_average.toString() },
      { field: "isRunning", old: currentShow.isRunning.toString(), new: (showData.next_episode_to_air !== null).toString() },
    ];

    for (const update of fieldUpdates) {
      if (update.old !== update.new) {
        await logFieldUpdate(show.id, "show", show.id, "updated", update.field, update.old, update.new);
        hasChanges = true;
      }
    }
  }

  // Update creators
  await prisma.showCreator.deleteMany({
    where: { showId: show.id },
  });

  for (const creator of showData.created_by) {
    const dbCreator = await findOrCreateCreator(creator);
    await prisma.showCreator.create({
      data: {
        showId: show.id,
        creatorId: dbCreator.id,
      },
    });
    
    // Log new creator relationship
    await logFieldUpdate(show.id, "creator", null, "created", "creatorId", null, dbCreator.id.toString());
    hasChanges = true;
  }

  // Update networks
  await prisma.showsOnNetworks.deleteMany({
    where: { showId: show.id },
  });

  const connectedNetworks = await Promise.all(
    showData.networks.map(findOrCreateNetwork)
  );

  for (const network of connectedNetworks) {
    await prisma.showsOnNetworks.create({
      data: { showId: show.id, networkId: network.id },
    });
    
    // Log new network relationship
    await logFieldUpdate(show.id, "network", null, "created", "networkId", null, network.id.toString());
    hasChanges = true;
  }

    return hasChanges;
}

async function updateSeason(showId: number, season: SeasonWithRelations, seasonData: {
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string;
  poster_path: string | null;
  vote_average: number;
}) {
  // Get current season data for comparison
  const currentSeason = await prisma.season.findUnique({
    where: { id: season.id },
    select: {
      episodeCount: true,
      airDate: true,
      overview: true,
      posterPath: true,
      tmdbRating: true,
    },
  });

  const newAirDate = seasonData.air_date && seasonData.air_date !== "null"
    ? new Date(seasonData.air_date)
    : null;

  const result = await prisma.season.update({
    where: { id: season.id },
    data: {
      episodeCount: seasonData.episode_count,
      airDate: newAirDate,
      overview: seasonData.overview || null,
      posterPath: safePath(seasonData.poster_path),
      tmdbRating: seasonData.vote_average,
    },
  });

  // Log season field updates
  if (currentSeason) {
    // Helper function to normalize dates for comparison
    const normalizeDate = (date: Date | string | null): string | null => {
      if (!date) return null;
      if (typeof date === 'string') {
        // If it's already a date string, extract just the date part
        return date.split('T')[0];
      }
      // If it's a Date object, convert to date string
      return date.toISOString().split('T')[0];
    };

    await logFieldUpdate(showId, "season", season.id, "updated", "episodeCount", currentSeason.episodeCount.toString(), seasonData.episode_count.toString());
    await logFieldUpdate(showId, "season", season.id, "updated", "airDate", normalizeDate(currentSeason.airDate), normalizeDate(newAirDate));
    await logFieldUpdate(showId, "season", season.id, "updated", "overview", currentSeason.overview, seasonData.overview || null);
    await logFieldUpdate(showId, "season", season.id, "updated", "posterPath", currentSeason.posterPath || null, safePath(seasonData.poster_path));
    await logFieldUpdate(showId, "season", season.id, "updated", "tmdbRating", currentSeason.tmdbRating?.toString() || null, seasonData.vote_average.toString());
  }

  return result;
}

async function createSeason(showId: number, seasonData: {
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string;
  poster_path: string | null;
  vote_average: number;
}) {
  const newAirDate = seasonData.air_date && seasonData.air_date !== "null"
    ? new Date(seasonData.air_date)
    : null;

  const newSeason = await prisma.season.create({
    data: {
      showId,
      seasonNumber: seasonData.season_number,
      episodeCount: seasonData.episode_count,
      airDate: newAirDate,
      overview: seasonData.overview || null,
      posterPath: safePath(seasonData.poster_path),
      tmdbRating: seasonData.vote_average,
    },
  });

  // Log new season creation
  await logFieldUpdate(showId, "season", newSeason.id, "created", "seasonNumber", null, seasonData.season_number.toString());
  await logFieldUpdate(showId, "season", newSeason.id, "created", "episodeCount", null, seasonData.episode_count.toString());
  await logFieldUpdate(showId, "season", newSeason.id, "created", "airDate", null, newAirDate?.toISOString() || null);
  await logFieldUpdate(showId, "season", newSeason.id, "created", "overview", null, seasonData.overview || null);
  await logFieldUpdate(showId, "season", newSeason.id, "created", "posterPath", null, safePath(seasonData.poster_path));
  await logFieldUpdate(showId, "season", newSeason.id, "created", "tmdbRating", null, seasonData.vote_average.toString());

  return newSeason;
}

async function updateEpisodes(showId: number, seasonId: number, episodes: Array<{
  episode_number: number;
  name: string;
  overview: string | null;
  vote_average: number;
  still_path: string | null;
  air_date: string | null;
}>) {
  // Get existing episodes for this season
  const existingEpisodes = await prisma.episode.findMany({
    where: { seasonId },
    select: { episodeNumber: true },
  });
  
  const existingEpisodeNumbers = new Set(existingEpisodes.map(ep => ep.episodeNumber));
  
  // Only add new episodes
  const newEpisodes = episodes.filter(ep => !existingEpisodeNumbers.has(ep.episode_number));
  
  if (newEpisodes.length > 0) {
    await prisma.episode.createMany({
      data: newEpisodes.map((ep) => ({
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

    // Log new episodes
    for (const episode of newEpisodes) {
      await logFieldUpdate(showId, "episode", null, "created", "episodeNumber", null, episode.episode_number.toString());
      await logFieldUpdate(showId, "episode", null, "created", "name", null, episode.name);
      await logFieldUpdate(showId, "episode", null, "created", "overview", null, episode.overview);
      await logFieldUpdate(showId, "episode", null, "created", "tmdbRating", null, episode.vote_average.toString());
      await logFieldUpdate(showId, "episode", null, "created", "stillPath", null, safePath(episode.still_path));
      await logFieldUpdate(showId, "episode", null, "created", "airDate", null, episode.air_date || null);
    }
  }
  
  return newEpisodes.length;
}

async function updateCharacters(
  showId: number,
  seasonId: number,
  credits: CreditDetails,
  episodes: SeasonDetails["episodes"]
) {
  // Get existing characters for this season
  const existingCharacters = await prisma.character.findMany({
    where: { seasonId },
    select: { personId: true },
  });
  
  const existingPersonIds = new Set(existingCharacters.map(char => char.personId));
  const processedPersonIds = new Set<number>();

  // Add main cast
  for (const person of credits.cast) {
    if (!person.name || processedPersonIds.has(person.id) || existingPersonIds.has(person.id)) continue;

    const dbPerson = await findOrCreatePerson(person);
    const character = await prisma.character.create({
      data: {
        seasonId,
        personId: dbPerson.id,
        showRole: person.character || null,
      },
    });

    // Log new character
    await logFieldUpdate(showId, "character", character.id, "created", "personId", null, dbPerson.id.toString());
    await logFieldUpdate(showId, "character", character.id, "created", "showRole", null, person.character || null);

    processedPersonIds.add(person.id);
  }

  // Add guest stars
  for (const episode of episodes) {
    for (const guest of episode.guest_stars) {
      if (!guest.name || processedPersonIds.has(guest.id) || existingPersonIds.has(guest.id)) continue;

      const dbPerson = await findOrCreatePerson(guest);
      const character = await prisma.character.create({
        data: {
          seasonId,
          personId: dbPerson.id,
          showRole: guest.character || null,
        },
      });

      // Log new character
      await logFieldUpdate(showId, "character", character.id, "created", "personId", null, dbPerson.id.toString());
      await logFieldUpdate(showId, "character", character.id, "created", "showRole", null, guest.character || null);

      processedPersonIds.add(guest.id);
    }
  }
  
  return processedPersonIds.size;
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
      homepage: networkDetails.homepage,
      logoPath: networkDetails.logo_path ?? null,
      originCountry: networkDetails.origin_country,
    },
  });
}

async function logFieldUpdate(
  showId: number,
  entityType: string,
  entityId: number | null,
  action: string,
  fieldName: string | null,
  oldValue: string | null,
  newValue: string | null
) {
  // Only log if values actually changed
  if (oldValue !== newValue) {
    await prisma.updateShowsLog.create({
      data: {
        showId,
        entityType,
        entityId,
        action,
        fieldName,
        oldValue,
        newValue,
      },
    });
  }
}

async function updateShowLastChecked(showId: number) {
  await prisma.showLastCheckedForUpdate.upsert({
    where: { showId },
    update: { lastChecked: new Date() },
    create: { showId, lastChecked: new Date() },
  });
}

async function updateShows() {
  console.log("Starting show updates...");
  
  // Get all shows with their last checked time and related data
  const shows = await prisma.show.findMany({
    include: {
      lastCheckedForUpdate: true,
      seasons: {
        include: {
          episodes: {
            select: {
              airDate: true,
              episodeNumber: true,
            },
            orderBy: { episodeNumber: 'desc' },
          },
        },
      },
    },
  });

  const totalShows = shows.length;
  console.log(`Found ${totalShows} shows in database`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let processedCount = 0;

  for (const show of shows) {
    processedCount++;
    console.log(`\n[${processedCount}/${totalShows}] Processing ${show.name}...`);
    try {
      const shouldCheck = shouldCheckForUpdates(show, show.lastCheckedForUpdate?.lastChecked || null);
      
      if (!shouldCheck) {
        console.log(`  Skipping - checked recently`);
        skippedCount++;
        continue;
      }

      console.log(`  Updating...`);
      
      const showDetails = await getShowDetails(show.tmdbId);
      const showHasChanges = await updateShow(show, showDetails);
      
      if (!showHasChanges) {
        console.log(`  Show up to date!`);
      }

      // Update existing seasons and create new ones
      for (const seasonData of showDetails.seasons) {
        const existingSeason = show.seasons.find(s => s.seasonNumber === seasonData.season_number);
        
        if (existingSeason) {
          // Update existing season
          await updateSeason(show.id, existingSeason, seasonData);

          try {
            const seasonRes = await fetch(
              `https://api.themoviedb.org/3/tv/${show.tmdbId}/season/${seasonData.season_number}?api_key=${API_KEY}`
            );
            const seasonDetails = (await seasonRes.json()) as SeasonDetails;

            const credits = await getSeasonCredits(show.tmdbId, seasonData.season_number);

            const newCharactersCount = await updateCharacters(show.id, existingSeason.id, credits, seasonDetails.episodes);
            const newEpisodesCount = await updateEpisodes(show.id, existingSeason.id, seasonDetails.episodes);

            if (newCharactersCount > 0 || newEpisodesCount > 0) {
              console.log(`  Season ${seasonData.season_number}: Added ${newEpisodesCount} episodes, ${newCharactersCount} characters`);
            }
          } catch (err) {
            console.error(`Error processing season ${seasonData.season_number} for ${show.name}:`, err);
          }
        } else {
          // Create new season
          console.log(`  Creating new season ${seasonData.season_number}...`);
          const newSeason = await createSeason(show.id, seasonData);
          
          try {
            const seasonRes = await fetch(
              `https://api.themoviedb.org/3/tv/${show.tmdbId}/season/${seasonData.season_number}?api_key=${API_KEY}`
            );
            const seasonDetails = (await seasonRes.json()) as SeasonDetails;

            const credits = await getSeasonCredits(show.tmdbId, seasonData.season_number);

            const newCharactersCount = await updateCharacters(show.id, newSeason.id, credits, seasonDetails.episodes);
            const newEpisodesCount = await updateEpisodes(show.id, newSeason.id, seasonDetails.episodes);

            console.log(`  Season ${seasonData.season_number}: Created with ${newEpisodesCount} episodes, ${newCharactersCount} characters`);
          } catch (err) {
            console.error(`Error processing new season ${seasonData.season_number} for ${show.name}:`, err);
          }
        }
      }

      // Update last checked time
      await updateShowLastChecked(show.id);
      
      updatedCount++;
      console.log(`  ✓ Updated successfully`);
      
      // Rate limiting - be nice to TMDB API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error updating ${show.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\nUpdate completed!`);
  console.log(`Updated: ${updatedCount} shows`);
  console.log(`Skipped: ${skippedCount} shows`);
  console.log(`Errors: ${errorCount} shows`);
}

updateShows()
  .catch((err) => {
    console.error("Error updating shows:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
