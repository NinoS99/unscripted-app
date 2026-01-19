import "dotenv/config";
import { PrismaClient, ActivityType, ActivityGroup } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

// Create PrismaClient with adapter for scripts
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Activity group mappings
const ACTIVITY_GROUP_MAPPINGS: Array<{
  activityType: ActivityType;
  activityGroup: ActivityGroup;
}> = [
  // Content Creation
  { activityType: 'REVIEW_CREATED', activityGroup: 'CONTENT_CREATION' },
  { activityType: 'DISCUSSION_CREATED', activityGroup: 'CONTENT_CREATION' },
  { activityType: 'WATCHLIST_CREATED', activityGroup: 'CONTENT_CREATION' },
  { activityType: 'PREDICTION_CREATED', activityGroup: 'CONTENT_CREATION' },
  
  // Engagement
  { activityType: 'REVIEW_LIKED', activityGroup: 'ENGAGEMENT' },
  { activityType: 'DISCUSSION_LIKED', activityGroup: 'ENGAGEMENT' },
  { activityType: 'WATCHLIST_LIKED', activityGroup: 'ENGAGEMENT' },
  { activityType: 'PREDICTION_LIKED', activityGroup: 'ENGAGEMENT' },
  { activityType: 'COMMENT_UPVOTED', activityGroup: 'ENGAGEMENT' },
  { activityType: 'COMMENT_DOWNVOTED', activityGroup: 'ENGAGEMENT' },
  { activityType: 'COMMENT_CREATED', activityGroup: 'ENGAGEMENT' },
  
  // Disengagement
  { activityType: 'REVIEW_UNLIKED', activityGroup: 'DISENGAGEMENT' },
  { activityType: 'DISCUSSION_UNLIKED', activityGroup: 'DISENGAGEMENT' },
  { activityType: 'WATCHLIST_UNLIKED', activityGroup: 'DISENGAGEMENT' },
  { activityType: 'PREDICTION_UNLIKED', activityGroup: 'DISENGAGEMENT' },
  
  // Prediction Market
  { activityType: 'SHARES_PURCHASED', activityGroup: 'PREDICTION_MARKET' },
  { activityType: 'SHARES_SOLD', activityGroup: 'PREDICTION_MARKET' },
  { activityType: 'PREDICTION_WON', activityGroup: 'PREDICTION_MARKET' },
  { activityType: 'PREDICTION_LOST', activityGroup: 'PREDICTION_MARKET' },
  
  // Social
  { activityType: 'USER_FOLLOWED', activityGroup: 'SOCIAL' },
  { activityType: 'USER_UNFOLLOWED', activityGroup: 'SOCIAL' }
];

async function seedActivityGroupMapping() {
  console.log("Starting activity group mapping seeding...\n");

  try {
    // Clear existing mappings
    const existingCount = await prisma.activityGroupMapping.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing mappings. Clearing them...`);
      await prisma.activityGroupMapping.deleteMany();
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const mapping of ACTIVITY_GROUP_MAPPINGS) {
      try {
        // Check if mapping already exists
        const existing = await prisma.activityGroupMapping.findUnique({
          where: { activityType: mapping.activityType }
        });

        if (existing) {
          console.log(`  - Skipping ${mapping.activityType} (already exists)`);
          skippedCount++;
          continue;
        }

        // Create the mapping
        await prisma.activityGroupMapping.create({
          data: {
            activityType: mapping.activityType,
            activityGroup: mapping.activityGroup
          }
        });

        console.log(`  ✓ Created ${mapping.activityType} → ${mapping.activityGroup}`);
        createdCount++;

      } catch (error) {
        console.error(`  ✗ Error creating ${mapping.activityType}:`, error);
      }
    }

    console.log(`\n✓ Activity group mapping seeding completed!`);
    console.log(`Created: ${createdCount} mappings`);
    console.log(`Skipped: ${skippedCount} mappings`);
    console.log(`Total: ${createdCount + skippedCount} mappings`);

    // Show summary by group
    console.log(`\nMappings by group:`);
    const groups: ActivityGroup[] = ['CONTENT_CREATION', 'ENGAGEMENT', 'PREDICTION_MARKET', 'SOCIAL'];
    
    for (const group of groups) {
      const count = await prisma.activityGroupMapping.count({
        where: { activityGroup: group }
      });
      console.log(`  ${group}: ${count} mappings`);
    }

  } catch (error) {
    console.error("Error during activity group mapping seeding:", error);
  }
}

// Run the script
seedActivityGroupMapping()
  .catch((err) => {
    console.error("Error seeding activity group mapping:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
