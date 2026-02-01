import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// R2-compatible S3 client
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// Signed URL expiry time in seconds (10 minutes)
const SIGNED_URL_EXPIRY = 600;

/**
 * Get file extension from media type
 */
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

/**
 * Upload a buffer to R2 with a UUID-based object key.
 * Returns the object key (NOT a URL).
 */
export async function uploadToR2(
  buffer: Buffer,
  mediaType: string
): Promise<string> {
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

/**
 * Generate a short-lived signed URL for an object key.
 * URLs expire after ~10 minutes.
 */
export async function getSignedUrl(objectKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  return awsGetSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRY });
}

/**
 * Generate signed URLs for multiple object keys in parallel.
 */
export async function getSignedUrls(
  objectKeys: string[]
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    objectKeys.map(async (key) => [key, await getSignedUrl(key)] as const)
  );
  return new Map(entries);
}
