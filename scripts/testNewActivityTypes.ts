import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNewActivityTypes() {
  try {
    console.log("Testing new activity types...");
    
    // Get a real user ID
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No users found in database");
      return;
    }
    
    // Test if we can create a UserActivity with the new UNLIKED types
    const testActivity = await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'REVIEW_UNLIKED',
        entityType: 'REVIEW',
        entityId: 1,
        description: 'Test unlike activity',
        points: 0
      }
    });
    
    console.log("✅ Successfully created test activity:", testActivity.id);
    
    // Clean up
    await prisma.userActivity.delete({
      where: { id: testActivity.id }
    });
    
    console.log("✅ Test activity cleaned up");
    
  } catch (error) {
    console.error("❌ Error testing new activity types:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewActivityTypes();
