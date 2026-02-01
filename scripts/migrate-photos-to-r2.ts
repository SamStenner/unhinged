/**
 * Migration script: Re-upload photos from Vercel Blob to Cloudflare R2
 * 
 * This script:
 * 1. Fetches all photos from the database (currently stored with Vercel Blob URLs)
 * 2. Downloads each image from the Vercel Blob URL
 * 3. Uploads to R2 with a new UUID-based object key
 * 4. Updates the database record with the new object key
 * 
 * Run with: npx tsx scripts/migrate-photos-to-r2.ts
 * 
 * IMPORTANT: 
 * - Set environment variables before running
 * - This script is idempotent - it skips photos that already have R2 object keys
 * - Run in batches for large datasets
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../db/schema";

// Validate environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize R2 client
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// Initialize database connection
const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

function getExtension(mediaType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mediaType] || "jpg";
}

function isR2ObjectKey(value: string): boolean {
  // R2 object keys start with "photos/" and contain a UUID
  return value.startsWith("photos/") && !value.startsWith("http");
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToR2(buffer: Buffer, mediaType: string): Promise<string> {
  const extension = getExtension(mediaType);
  const objectKey = `photos/${randomUUID()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: buffer,
      ContentType: mediaType,
    })
  );

  return objectKey;
}

async function migratePhotos() {
  console.log("Starting photo migration to R2...\n");

  // Fetch all photos
  // Note: The schema now uses objectKey, but existing data may still have URLs
  // We need to check if the value looks like a URL or already an object key
  const photos = await db.select().from(schema.generatedPhotos);
  
  console.log(`Found ${photos.length} photos to check.\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const photo of photos) {
    try {
      // Check if already migrated (value is an R2 object key, not a URL)
      if (isR2ObjectKey(photo.objectKey)) {
        console.log(`[SKIP] Photo ${photo.id} - already migrated`);
        skipped++;
        continue;
      }

      // The objectKey field currently contains the old Vercel Blob URL
      const oldUrl = photo.objectKey;
      
      console.log(`[MIGRATE] Photo ${photo.id}`);
      console.log(`  Downloading from: ${oldUrl.substring(0, 60)}...`);

      // Download the image
      const buffer = await downloadImage(oldUrl);
      console.log(`  Downloaded: ${buffer.length} bytes`);

      // Upload to R2
      const newObjectKey = await uploadToR2(buffer, photo.mediaType);
      console.log(`  Uploaded to R2: ${newObjectKey}`);

      // Update database
      await db
        .update(schema.generatedPhotos)
        .set({ objectKey: newObjectKey })
        .where(eq(schema.generatedPhotos.id, photo.id));
      
      console.log(`  Database updated successfully\n`);
      migrated++;

    } catch (error) {
      console.error(`[FAILED] Photo ${photo.id}: ${error}`);
      failed++;
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (already migrated): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${photos.length}`);

  // Close database connection
  await sql.end();
}

// Run migration
migratePhotos().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
