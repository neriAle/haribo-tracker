import "dotenv/config";
import { db } from "./index";
import { categories } from "./schema";

const MANDATORY_CATEGORIES = [
  { name: "Gommose" },
  { name: "Frizzanti" },
  { name: "Liquirizie" },
  { name: "Mix" },
  { name: "Marshmallow" },
  { name: "Natale" },
  { name: "Pasqua" },
  { name: "Limited Edition" },
];

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    await db
      .insert(categories)
      .values(MANDATORY_CATEGORIES)
      .onConflictDoNothing();

    console.log("✅ Categories seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
  process.exit(0);
}

seed();
