"use server";

import { eq, and, sql } from "drizzle-orm";
import {
  db,
  users,
  generatedPhotos,
  photoSlots,
  prompts,
  type User,
  type GeneratedPhoto,
} from "@/db";

// ============ User Operations ============

export async function getOrCreateUser(authId: string): Promise<User> {
  // Try to find existing user
  const existing = await db.query.users.findFirst({
    where: eq(users.authId, authId),
  });

  if (existing) {
    return existing;
  }

  // Create new user
  const [newUser] = await db.insert(users).values({ authId }).returning();
  return newUser;
}

export async function getUserByAuthId(authId: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.authId, authId),
  });
  return user ?? null;
}

export async function updateUserProfile(
  authId: string,
  updates: {
    name?: string | null;
    age?: number | null;
    gender?: string | null;
    height?: string | null;
    location?: string | null;
  }
): Promise<User | null> {
  const user = await getUserByAuthId(authId);
  if (!user) return null;

  const [updated] = await db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return updated;
}

// ============ Balance Operations ============

export async function getBalance(authId: string): Promise<number> {
  const user = await getUserByAuthId(authId);
  return user?.balance ?? 0;
}

export async function addBalance(
  authId: string,
  amount: number
): Promise<number | null> {
  const user = await getUserByAuthId(authId);
  if (!user) return null;

  const [updated] = await db
    .update(users)
    .set({
      balance: sql`${users.balance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return updated.balance;
}

export async function deductBalance(
  authId: string,
  amount: number
): Promise<{ success: boolean; newBalance: number }> {
  const user = await getUserByAuthId(authId);
  if (!user) return { success: false, newBalance: 0 };

  if (user.balance < amount) {
    return { success: false, newBalance: user.balance };
  }

  const [updated] = await db
    .update(users)
    .set({
      balance: sql`${users.balance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return { success: true, newBalance: updated.balance };
}

// ============ Full Profile Fetch ============

export interface ProfileWithPhotosAndPrompts {
  user: User;
  photos: Array<{
    id: string;
    url: string;
    mediaType: string;
    slot: number;
  }>;
  allGeneratedPhotos: GeneratedPhoto[];
  prompts: Array<{
    id: string;
    prompt: string;
    answer: string;
    order: number;
  }>;
}

export async function getUserProfile(
  authId: string
): Promise<ProfileWithPhotosAndPrompts | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.authId, authId),
    with: {
      photoSlots: {
        with: {
          photo: true,
        },
      },
      generatedPhotos: {
        orderBy: (photos, { desc }) => [desc(photos.createdAt)],
      },
      prompts: {
        orderBy: (p, { asc }) => [asc(p.order)],
      },
    },
  });

  if (!user) return null;

  return {
    user,
    photos: user.photoSlots.map((slot) => ({
      id: slot.photo.id,
      url: slot.photo.url,
      mediaType: slot.photo.mediaType,
      slot: slot.slot,
    })),
    allGeneratedPhotos: user.generatedPhotos,
    prompts: user.prompts.map((p) => ({
      id: p.id,
      prompt: p.prompt,
      answer: p.answer,
      order: p.order,
    })),
  };
}

// ============ Generated Photos Operations ============

export async function addGeneratedPhoto(
  authId: string,
  url: string,
  mediaType: string
): Promise<GeneratedPhoto | null> {
  const user = await getUserByAuthId(authId);
  if (!user) return null;

  const [photo] = await db
    .insert(generatedPhotos)
    .values({
      userId: user.id,
      url,
      mediaType,
    })
    .returning();

  return photo;
}

export async function addGeneratedPhotos(
  authId: string,
  photos: Array<{ url: string; mediaType: string }>
): Promise<GeneratedPhoto[]> {
  const user = await getUserByAuthId(authId);
  if (!user) return [];

  const inserted = await db
    .insert(generatedPhotos)
    .values(
      photos.map((p) => ({
        userId: user.id,
        url: p.url,
        mediaType: p.mediaType,
      }))
    )
    .returning();

  return inserted;
}

export async function getAllGeneratedPhotos(
  authId: string
): Promise<GeneratedPhoto[]> {
  const user = await getUserByAuthId(authId);
  if (!user) return [];

  return db.query.generatedPhotos.findMany({
    where: eq(generatedPhotos.userId, user.id),
    orderBy: (photos, { desc }) => [desc(photos.createdAt)],
  });
}

// ============ Photo Slot Operations ============

export async function setPhotoSlot(
  authId: string,
  photoId: string,
  slot: number
): Promise<boolean> {
  const user = await getUserByAuthId(authId);
  if (!user) return false;

  // Upsert - insert or update if slot already exists
  await db
    .insert(photoSlots)
    .values({
      userId: user.id,
      photoId,
      slot,
    })
    .onConflictDoUpdate({
      target: [photoSlots.userId, photoSlots.slot],
      set: {
        photoId,
        updatedAt: new Date(),
      },
    });

  return true;
}

export async function removePhotoFromSlot(
  authId: string,
  slot: number
): Promise<boolean> {
  const user = await getUserByAuthId(authId);
  if (!user) return false;

  await db
    .delete(photoSlots)
    .where(and(eq(photoSlots.userId, user.id), eq(photoSlots.slot, slot)));

  return true;
}

export async function swapPhotoSlots(
  authId: string,
  slotA: number,
  slotB: number
): Promise<boolean> {
  const user = await getUserByAuthId(authId);
  if (!user) return false;

  // Get current slots
  const currentSlots = await db.query.photoSlots.findMany({
    where: and(
      eq(photoSlots.userId, user.id),
      sql`${photoSlots.slot} IN (${slotA}, ${slotB})`
    ),
  });

  const slotAData = currentSlots.find((s) => s.slot === slotA);
  const slotBData = currentSlots.find((s) => s.slot === slotB);

  // Perform swap in transaction
  await db.transaction(async (tx) => {
    // First, delete both slots to avoid unique constraint issues
    await tx
      .delete(photoSlots)
      .where(
        and(
          eq(photoSlots.userId, user.id),
          sql`${photoSlots.slot} IN (${slotA}, ${slotB})`
        )
      );

    // Then insert with swapped slots
    const newSlots = [];
    if (slotAData) {
      newSlots.push({
        userId: user.id,
        photoId: slotAData.photoId,
        slot: slotB,
      });
    }
    if (slotBData) {
      newSlots.push({
        userId: user.id,
        photoId: slotBData.photoId,
        slot: slotA,
      });
    }

    if (newSlots.length > 0) {
      await tx.insert(photoSlots).values(newSlots);
    }
  });

  return true;
}

// ============ Prompt Operations ============

export async function addPrompt(
  authId: string,
  prompt: string,
  answer: string
): Promise<{ id: string; prompt: string; answer: string; order: number } | null> {
  const user = await getUserByAuthId(authId);
  if (!user) return null;

  // Get current max order
  const existing = await db.query.prompts.findMany({
    where: eq(prompts.userId, user.id),
  });

  if (existing.length >= 3) {
    return null; // Max 3 prompts
  }

  const [newPrompt] = await db
    .insert(prompts)
    .values({
      userId: user.id,
      prompt,
      answer,
      order: existing.length,
    })
    .returning();

  return {
    id: newPrompt.id,
    prompt: newPrompt.prompt,
    answer: newPrompt.answer,
    order: newPrompt.order,
  };
}

export async function updatePrompt(
  authId: string,
  promptId: string,
  updates: { prompt?: string; answer?: string }
): Promise<boolean> {
  const user = await getUserByAuthId(authId);
  if (!user) return false;

  await db
    .update(prompts)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)));

  return true;
}

export async function removePrompt(
  authId: string,
  promptId: string
): Promise<boolean> {
  const user = await getUserByAuthId(authId);
  if (!user) return false;

  // Delete the prompt
  await db
    .delete(prompts)
    .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)));

  // Reorder remaining prompts
  const remaining = await db.query.prompts.findMany({
    where: eq(prompts.userId, user.id),
    orderBy: (p, { asc }) => [asc(p.order)],
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) {
      await db
        .update(prompts)
        .set({ order: i, updatedAt: new Date() })
        .where(eq(prompts.id, remaining[i].id));
    }
  }

  return true;
}
