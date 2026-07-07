import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// --- TABLES ---

export const packets = sqliteTable("packets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  language: text("language"),
  imageUrl: text("image_url").notNull(),
  dateAcquired: text("date_acquired"),
  locationAcquired: text("location_acquired"),
  rating: real("rating"),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
});

export const packetCategories = sqliteTable(
  "packet_categories",
  {
    packetId: text("packet_id")
      .notNull()
      .references(() => packets.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [
    // Composite Primary Key guarantees no duplicate labels on the same packet
    primaryKey({ columns: [t.packetId, t.categoryId] }),
  ],
);

// --- RELATIONS ---

export const packetRelations = relations(packets, ({ many }) => ({
  packetCategories: many(packetCategories),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  packetCategories: many(packetCategories),
}));

export const packetCategoriesRelations = relations(
  packetCategories,
  ({ one }) => ({
    packet: one(packets, {
      fields: [packetCategories.packetId],
      references: [packets.id],
    }),
    category: one(categories, {
      fields: [packetCategories.categoryId],
      references: [categories.id],
    }),
  }),
);
