import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Prediction templates organized by show type
const PREDICTION_TEMPLATES = [
  // Universal templates (apply to all competition shows)
  {
    name: "elimination_prediction",
    description: "Predict if a contestant will be eliminated",
    template: "X will be eliminated",
    showTypes: ["talent", "dating", "survival", "competition"]
  },
  {
    name: "safe_prediction",
    description: "Predict if a contestant will be safe",
    template: "X will be safe",
    showTypes: ["talent", "dating", "survival", "competition"]
  },
  {
    name: "win_challenge_prediction",
    description: "Predict if a contestant will win a challenge",
    template: "X will win a challenge",
    showTypes: ["talent", "survival", "competition"]
  },
  {
    name: "win_contest_prediction",
    description: "Predict if a contestant will win the contest",
    template: "X will win the contest",
    showTypes: ["talent", "dating", "survival", "competition"]
  },

  // Talent show specific templates
  {
    name: "positive_judge_feedback",
    description: "Predict if a contestant will receive positive feedback from judges",
    template: "X will receive positive feedback from judges",
    showTypes: ["talent"]
  },
  {
    name: "negative_judge_feedback",
    description: "Predict if a contestant will receive negative feedback from judges",
    template: "X will receive negative feedback from judges",
    showTypes: ["talent"]
  },
  {
    name: "advance_next_round",
    description: "Predict if a contestant will advance to the next round",
    template: "X will advance to the next round",
    showTypes: ["talent"]
  },

  // Dating show specific templates
  {
    name: "receive_rose",
    description: "Predict if a contestant will receive a rose",
    template: "X will receive a rose",
    showTypes: ["dating"]
  },
  {
    name: "sent_home",
    description: "Predict if a contestant will be sent home",
    template: "X will be sent home",
    showTypes: ["dating"]
  },
  {
    name: "one_on_one_date",
    description: "Predict if a contestant will have a one-on-one date",
    template: "X will have a one-on-one date",
    showTypes: ["dating"]
  },

  // Survival show specific templates
  {
    name: "win_immunity",
    description: "Predict if a contestant will win immunity",
    template: "X will win immunity",
    showTypes: ["survival"]
  },
  {
    name: "receive_immunity",
    description: "Predict if a contestant will receive immunity",
    template: "X will receive immunity",
    showTypes: ["survival"]
  },
  {
    name: "form_alliance",
    description: "Predict if a contestant will form an alliance with another",
    template: "X will form an alliance with Y",
    showTypes: ["survival", "competition"]
  },
  {
    name: "betray_alliance",
    description: "Predict if a contestant will betray another",
    template: "X will betray Y",
    showTypes: ["survival", "competition"]
  },

  // General competition templates
  {
    name: "bottom_pool",
    description: "Predict if a contestant will be in the bottom pool",
    template: "X will be in the bottom pool",
    showTypes: ["talent", "competition"]
  },
  {
    name: "most_votes",
    description: "Predict if a contestant will receive the most votes from other contestants",
    template: "X will receive the most votes from other contestants",
    showTypes: ["survival", "competition"]
  },
  {
    name: "major_argument",
    description: "Predict if a contestant will have a major argument with another contestant",
    template: "X will have a major argument with another contestant",
    showTypes: ["talent", "dating", "survival", "competition"]
  }
];

async function seedPredictionTemplates() {
  console.log("Starting prediction templates seeding...\n");

  try {
    // Clear existing templates (optional - remove if you want to keep existing ones)
    const existingCount = await prisma.predictionTemplate.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing templates. Clearing them...`);
      await prisma.predictionTemplate.deleteMany();
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const template of PREDICTION_TEMPLATES) {
      try {
        // Check if template already exists
        const existing = await prisma.predictionTemplate.findUnique({
          where: { name: template.name }
        });

        if (existing) {
          console.log(`  - Skipping ${template.name} (already exists)`);
          skippedCount++;
          continue;
        }

        // Create the template
        await prisma.predictionTemplate.create({
          data: {
            name: template.name,
            description: template.description,
            template: template.template,
            showTypes: template.showTypes,
            isActive: true
          }
        });

        console.log(`  ✓ Created ${template.name}: "${template.template}"`);
        console.log(`    Applies to: ${template.showTypes.join(', ')}`);
        createdCount++;

      } catch (error) {
        console.error(`  ✗ Error creating ${template.name}:`, error);
      }
    }

    console.log(`\n✓ Prediction templates seeding completed!`);
    console.log(`Created: ${createdCount} templates`);
    console.log(`Skipped: ${skippedCount} templates`);
    console.log(`Total: ${createdCount + skippedCount} templates`);

    // Show summary by show type
    console.log(`\nTemplates by show type:`);
    const showTypes = ["talent", "dating", "survival", "competition"];
    
    for (const showType of showTypes) {
      const count = await prisma.predictionTemplate.count({
        where: {
          showTypes: { has: showType },
          isActive: true
        }
      });
      console.log(`  ${showType}: ${count} templates`);
    }

  } catch (error) {
    console.error("Error during prediction templates seeding:", error);
  }
}

// Run the script
seedPredictionTemplates()
  .catch((err) => {
    console.error("Error seeding prediction templates:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
