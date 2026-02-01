import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - links to Supabase auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: text("auth_id").notNull().unique(),
  name: text("name"),
  age: integer("age"),
  gender: text("gender"),
  height: text("height"),
  location: text("location"),
  balance: integer("balance").default(60).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Generated photos - all photos a user has ever generated
export const generatedPhotos = pgTable("generated_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull(), // R2 object key (e.g. "photos/{uuid}.jpg")
  mediaType: text("media_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Photo slots - which photos are currently in which slots (0-5)
export const photoSlots = pgTable(
  "photo_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => generatedPhotos.id, { onDelete: "cascade" }),
    slot: integer("slot").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Each user can only have one photo per slot
    unique("user_slot_unique").on(table.userId, table.slot),
  ]
);

// Prompts - user's prompt answers
export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  generatedPhotos: many(generatedPhotos),
  photoSlots: many(photoSlots),
  prompts: many(prompts),
}));

export const generatedPhotosRelations = relations(
  generatedPhotos,
  ({ one, many }) => ({
    user: one(users, {
      fields: [generatedPhotos.userId],
      references: [users.id],
    }),
    photoSlots: many(photoSlots),
  })
);

export const photoSlotsRelations = relations(photoSlots, ({ one }) => ({
  user: one(users, {
    fields: [photoSlots.userId],
    references: [users.id],
  }),
  photo: one(generatedPhotos, {
    fields: [photoSlots.photoId],
    references: [generatedPhotos.id],
  }),
}));

export const promptsRelations = relations(prompts, ({ one }) => ({
  user: one(users, {
    fields: [prompts.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GeneratedPhoto = typeof generatedPhotos.$inferSelect;
export type NewGeneratedPhoto = typeof generatedPhotos.$inferInsert;
export type PhotoSlot = typeof photoSlots.$inferSelect;
export type NewPhotoSlot = typeof photoSlots.$inferInsert;
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
