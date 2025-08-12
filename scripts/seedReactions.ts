import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reactionTypes = [
  // Positive reactions
  { name: "slay", description: "For when someone absolutely kills it", emoji: "💅", category: "positive" },
  { name: "periodt", description: "For emphatic agreement", emoji: "💯", category: "positive" },
  { name: "yasss", description: "For excitement and celebration", emoji: "✨", category: "positive" },
  { name: "queen", description: "For showing respect/admiration", emoji: "👑", category: "positive" },
  { name: "king", description: "For showing respect/admiration", emoji: "👑", category: "positive" },
  { name: "iconic", description: "For legendary moments", emoji: "🌟", category: "positive" },
  { name: "serve", description: "For when someone delivers", emoji: "🔥", category: "positive" },
  { name: "crown", description: "For crowning someone the winner", emoji: "👑", category: "positive" },
  
  // Negative reactions
  { name: "gagged", description: "For being shocked/surprised", emoji: "😱", category: "negative" },
  { name: "pissed", description: "For being angry", emoji: "😤", category: "negative" },
  { name: "cringe", description: "For second-hand embarrassment", emoji: "😬", category: "negative" },
  { name: "mess", description: "For chaotic situations", emoji: "💀", category: "negative" },
  { name: "trash", description: "For something terrible", emoji: "🗑️", category: "negative" },
  { name: "bye", description: "For dismissal", emoji: "👋", category: "negative" },
  { name: "nope", description: "For disagreement", emoji: "🙅", category: "negative" },
  { name: "ew", description: "For disgust", emoji: "🤢", category: "negative" },
  
  // Emotional reactions
  { name: "crying", description: "For sadness or laughing so hard you cry", emoji: "😭", category: "emotional" },
  { name: "dead", description: "For being deceased from laughter/shock", emoji: "💀", category: "emotional" },
  { name: "screaming", description: "For extreme reactions", emoji: "😱", category: "emotional" },
  { name: "shook", description: "For being shocked", emoji: "😨", category: "emotional" },
  { name: "wig", description: "For having your wig snatched (shocked)", emoji: "💇‍♀️", category: "emotional" },
  { name: "tea", description: "For gossip/drama", emoji: "☕", category: "emotional" },
  { name: "spill", description: "For spilling the tea (sharing gossip)", emoji: "🫖", category: "emotional" },
  { name: "receipts", description: "For proof/evidence", emoji: "🧾", category: "emotional" },
  
  // Reality TV specific
  { name: "drama", description: "For dramatic moments", emoji: "🎭", category: "reality-tv" },
  { name: "plot", description: "For plotting/scheming", emoji: "🤔", category: "reality-tv" },
  { name: "alliance", description: "For strategic partnerships", emoji: "🤝", category: "reality-tv" },
  { name: "betrayal", description: "For backstabbing", emoji: "🗡️", category: "reality-tv" },
  { name: "elimination", description: "For someone getting voted out", emoji: "🚪", category: "reality-tv" },
  { name: "immunity", description: "For being safe", emoji: "🛡️", category: "reality-tv" },
  { name: "challenge", description: "For competition moments", emoji: "🏆", category: "reality-tv" },
  { name: "confessional", description: "For behind-the-scenes moments", emoji: "🎤", category: "reality-tv" }
];

async function seedReactionTypes() {
  console.log('🌱 Starting to seed reaction types...');

  try {
    // Clear existing reaction types first
    await prisma.reactionType.deleteMany({});
    console.log('🗑️  Cleared existing reaction types');

    // Create reaction types
    console.log('📝 Creating reaction types...');
    const createdReactionTypes = [];
    for (const reactionType of reactionTypes) {
      const created = await prisma.reactionType.create({
        data: reactionType,
      });
      createdReactionTypes.push(created);
    }

    console.log(`✅ Successfully created ${createdReactionTypes.length} reaction types:`);
    console.log('\n📝 Available reaction types:');
    createdReactionTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type.emoji || '•'} ${type.name} (${type.category})`);
    });

  } catch (error) {
    console.error('❌ Error seeding reaction types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedReactionTypes()
  .then(() => {
    console.log('🎉 Reaction type seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Reaction type seeding failed:', error);
    process.exit(1);
  });
