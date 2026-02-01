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
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSignedUrl } from "@/lib/r2";

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

// Photo with signed URL and slot for profile display
export interface SlottedPhotoWithSignedUrl {
  id: string;
  url: string; // Signed URL
  mediaType: string;
  slot: number;
}

// Photo with signed URL for all generated photos
export interface GeneratedPhotoWithSignedUrl {
  id: string;
  objectKey: string;
  url: string; // Signed URL
  mediaType: string;
  createdAt: Date;
}

export interface ProfileWithPhotosAndPrompts {
  user: User;
  photos: SlottedPhotoWithSignedUrl[];
  allGeneratedPhotos: GeneratedPhotoWithSignedUrl[];
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

  // Generate signed URLs for slotted photos
  const photosWithSignedUrls = await Promise.all(
    user.photoSlots.map(async (slot) => ({
      id: slot.photo.id,
      url: await getSignedUrl(slot.photo.objectKey),
      mediaType: slot.photo.mediaType,
      slot: slot.slot,
    }))
  );

  // Generate signed URLs for all generated photos
  const allPhotosWithSignedUrls = await Promise.all(
    user.generatedPhotos.map(async (photo) => ({
      ...photo,
      // Add url field with signed URL for compatibility
      url: await getSignedUrl(photo.objectKey),
    }))
  );

  return {
    user,
    photos: photosWithSignedUrls,
    allGeneratedPhotos: allPhotosWithSignedUrls,
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
  objectKey: string,
  mediaType: string
): Promise<GeneratedPhoto | null> {
  const user = await getUserByAuthId(authId);
  if (!user) return null;

  const [photo] = await db
    .insert(generatedPhotos)
    .values({
      userId: user.id,
      objectKey,
      mediaType,
    })
    .returning();

  return photo;
}

export async function addGeneratedPhotos(
  authId: string,
  photos: Array<{ objectKey: string; mediaType: string }>
): Promise<GeneratedPhoto[]> {
  const user = await getUserByAuthId(authId);
  if (!user) return [];

  const inserted = await db
    .insert(generatedPhotos)
    .values(
      photos.map((p) => ({
        userId: user.id,
        objectKey: p.objectKey,
        mediaType: p.mediaType,
      }))
    )
    .returning();

  return inserted;
}

export async function getAllGeneratedPhotos(
  authId: string
): Promise<GeneratedPhotoWithSignedUrl[]> {
  const user = await getUserByAuthId(authId);
  if (!user) return [];

  const dbPhotos = await db.query.generatedPhotos.findMany({
    where: eq(generatedPhotos.userId, user.id),
    orderBy: (photos, { desc }) => [desc(photos.createdAt)],
  });

  // Generate signed URLs for all photos
  return Promise.all(
    dbPhotos.map(async (photo) => ({
      id: photo.id,
      objectKey: photo.objectKey,
      url: await getSignedUrl(photo.objectKey),
      mediaType: photo.mediaType,
      createdAt: photo.createdAt,
    }))
  );
}

export interface PaginatedPhotosResult {
  photos: GeneratedPhotoWithSignedUrl[];
  hasMore: boolean;
  total: number;
}

export async function getGeneratedPhotosPaginated(
  page: number = 0,
  limit: number = 15
): Promise<PaginatedPhotosResult> {
  // Get auth from server session
  const supabase = await createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    return { photos: [], hasMore: false, total: 0 };
  }

  const user = await getUserByAuthId(authUser.id);
  if (!user) return { photos: [], hasMore: false, total: 0 };

  const offset = page * limit;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(generatedPhotos)
    .where(eq(generatedPhotos.userId, user.id));
  const total = Number(countResult[0]?.count ?? 0);

  // Get paginated photos
  const dbPhotos = await db.query.generatedPhotos.findMany({
    where: eq(generatedPhotos.userId, user.id),
    orderBy: (photos, { desc }) => [desc(photos.createdAt)],
    limit: limit,
    offset: offset,
  });

  // Generate signed URLs for all photos
  const photosWithSignedUrls = await Promise.all(
    dbPhotos.map(async (photo) => ({
      id: photo.id,
      objectKey: photo.objectKey,
      url: await getSignedUrl(photo.objectKey),
      mediaType: photo.mediaType,
      createdAt: photo.createdAt,
    }))
  );

  return {
    photos: photosWithSignedUrls,
    hasMore: offset + dbPhotos.length < total,
    total,
  };
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
