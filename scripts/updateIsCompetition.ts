import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const API_KEY = process.env.TMDB_API_KEY;

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
 * Updates the isCompetition flag for a specific show
 */
async function updateShowCompetitionStatus(show: { id: number; tmdbId: number; name: string; isCompetition: boolean }) {
  console.log(`Checking ${show.name}...`);
  
  try {
    const keywords = await getShowKeywords(show.tmdbId);
    const shouldBeCompetition = isCompetitionShow(keywords);
    
    if (shouldBeCompetition !== show.isCompetition) {
      await prisma.show.update({
        where: { id: show.id },
        data: { isCompetition: shouldBeCompetition }
      });
      
      console.log(`  ✓ Updated ${show.name}: ${show.isCompetition} → ${shouldBeCompetition}`);
      if (keywords.length > 0) {
        console.log(`    Keywords: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? '...' : ''}`);
      }
      
      return true;
    } else {
      console.log(`  - ${show.name}: Already correct (${show.isCompetition})`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${show.name}:`, error);
    return false;
  }
}

/**
 * Main function to update competition status for all shows
 */
async function updateIsCompetition() {
  console.log("Starting competition status update for all shows...\n");
  
  try {
    // Get all shows from the database
    const shows = await prisma.show.findMany({
      select: {
        id: true,
        tmdbId: true,
        name: true,
        isCompetition: true,
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${shows.length} shows to process\n`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const show of shows) {
      processedCount++;
      console.log(`[${processedCount}/${shows.length}] `, { end: '' });
      
      try {
        const wasUpdated = await updateShowCompetitionStatus(show);
        if (wasUpdated) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error processing show ${show.name}:`, error);
        errorCount++;
      }
      
      // Rate limiting - be nice to TMDB API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✓ Competition status update completed!`);
    console.log(`Processed: ${processedCount} shows`);
    console.log(`Updated: ${updatedCount} shows`);
    console.log(`Errors: ${errorCount} shows`);
    
    // Show summary of competition vs non-competition shows
    const competitionCount = await prisma.show.count({
      where: { isCompetition: true }
    });
    const totalCount = await prisma.show.count();
    
    console.log(`\nFinal counts:`);
    console.log(`Competition shows: ${competitionCount}`);
    console.log(`Non-competition shows: ${totalCount - competitionCount}`);
    console.log(`Total shows: ${totalCount}`);

  } catch (error) {
    console.error("Error during competition status update:", error);
  }
}

// Run the script
updateIsCompetition()
  .catch((err) => {
    console.error("Error updating competition status:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
