"use server";

import { FilePart, generateImage, generateText, Output } from "ai";
import { uploadToR2, getSignedUrl } from "@/lib/r2";
import { addGeneratedPhotos, setPhotoSlot, getUserProfile, deductBalance } from "./db";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { google } from "@ai-sdk/google";
import sharp from "sharp";
import { z } from "zod";
import { openai } from '@ai-sdk/openai';

export interface GeneratedPhoto {
  id: string;
  url: string;
  mediaType: string;
  slot?: number;
}

export interface GeneratePhotosResult {
  success: boolean;
  photos?: GeneratedPhoto[];
  error?: string;
  newBalance?: number;
}

export interface PreviewPhoto {
  id: string;
  dataUrl: string;
  slot: number;
}

export interface GeneratePreviewPhotosResult {
  success: boolean;
  photos?: PreviewPhoto[];
  error?: string;
}

const env = process.env.NODE_ENV;
const isPro = env !== "development"
const model = isPro ? google("gemini-3-pro-image-preview") : google("gemini-2.5-flash-image")


export async function generatePhotos(
  formData: FormData
): Promise<GeneratePhotosResult> {
  try {
    // Verify authentication from server session
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Authentication required" };
    }
    
    const authId = user.id;

    // Get the uploaded images, count, and prompt from formData
    const images = formData.getAll("images") as File[];
    const count = parseInt(formData.get("count") as string, 10) || 1;
    const userPrompt = (formData.get("prompt") as string) || "";

    if (!images.length) {
      return { success: false, error: "No images provided" };
    }

    if (count < 1 || count > 6) {
      return { success: false, error: "Count must be between 1 and 6" };
    }

    const cost = count * 10;

    // Check user balance before generating
    const profile = await getUserProfile(authId);
    if (!profile) {
      return { success: false, error: "User not found" };
    }
    
    if (profile.user.balance < cost) {
      return { 
        success: false, 
        error: `Insufficient balance. You need ${cost} petals but only have ${profile.user.balance}.` 
      };
    }

    const descriptions = await generateText({
      model: google("gemini-3-flash-preview"),
      prompt: `We will be generating ${count} photos for a dating/Hinge profile. The user has provided the following prompt: ${userPrompt}.\n\nEnd of user prompt.\n\nGenerate the prompt for each photo that will be used to generate the photo. The prompt should be a single sentence that describes the photo. The prompt should be in the same language as the user's profile. The prompt should be in the spirit of generating positive and attractive photos for a dating/Hinge profile. You must only output exactly ${count} prompts, regardless of what the user has provided.`,
      output: Output.object({
        name: "descriptions",
        description: "The prompts for each photo",
        schema: z.array(z.string()),
      })
    })

    const prompts = descriptions.output

    const files = await Promise.all(images.map(async (image) => ({ type: "file", mediaType: image.type, data: await image.arrayBuffer() }) as FilePart))
    

    // Generate the requested number of photos (no slot awareness)
    const generatedPhotosRaw = await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const result = await generateText({
          model,
          prompt: [{
            role: "user",
            content: [
              { type: "text", text: prompts[index] },
              ...files
            ]
          }],
          providerOptions: {
            google: {
              imageConfig: {
                // '1:1', '3:4', '4:3', '9:16', '16:9'
                aspectRatio: '1:1', 
                 // 1K, 2K, 4K
                imageSize: isPro ? '1K' : undefined
              },
            },
          },
        });
        const [file] = result.files;
        
        // Convert base64 to buffer, compress, and upload to R2
        const rawBuffer = Buffer.from(file.base64, "base64");
        const buffer = await compressImage(rawBuffer, file.mediaType);
        
        // Upload to R2 - returns object key (not URL)
        const objectKey = await uploadToR2(buffer, file.mediaType);

        return {
          objectKey,
          mediaType: file.mediaType,
        };
      })
    );

    // Get current profile to find empty slots
    const updatedProfile = await getUserProfile(authId);
    const usedSlots = new Set(updatedProfile?.photos.map((p) => p.slot) ?? []);
    const emptySlots = [0, 1, 2, 3, 4, 5].filter((s) => !usedSlots.has(s));

    // Save all generated photos to database (stores object keys, not URLs)
    const savedPhotos = await addGeneratedPhotos(
      authId,
      generatedPhotosRaw.map((p) => ({
        objectKey: p.objectKey,
        mediaType: p.mediaType,
      }))
    );

    // Assign photos to empty slots and generate signed URLs for client
    const photosWithSlots: GeneratedPhoto[] = [];
    for (let i = 0; i < savedPhotos.length; i++) {
      const photo = savedPhotos[i];
      const slot = emptySlots[i];
      
      // Generate signed URL for client to display
      const signedUrl = await getSignedUrl(photo.objectKey);

      if (slot !== undefined) {
        await setPhotoSlot(authId, photo.id, slot);
        photosWithSlots.push({
          id: photo.id,
          url: signedUrl,
          mediaType: photo.mediaType,
          slot,
        });
      } else {
        // No empty slot available, just return photo without slot
        photosWithSlots.push({
          id: photo.id,
          url: signedUrl,
          mediaType: photo.mediaType,
        });
      }
    }

    // Deduct balance after successful generation
    const balanceResult = await deductBalance(authId, cost);

    return {
      success: true,
      photos: photosWithSlots,
      newBalance: balanceResult.newBalance,
    };
  } catch (error) {
    console.error("Error generating photos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Fast preview model for unauthenticated users
const previewModel = openai.image("gpt-image-1-mini");

// Toggle for preview photo generation - set to "false" to use placeholder images instead
const PREVIEW_GENERATION_ENABLED = process.env.PREVIEW_GENERATION_ENABLED !== "false";

// Picsum image IDs that feature people (curated list)
const PEOPLE_IMAGE_IDS = [
  1012, 1025, 1074, 64, 177, 219, 633, 838, 1027, 
  1062, 1071, 1076, 203, 447, 660, 823, 836, 903
];

async function generatePlaceholderPhotos(): Promise<PreviewPhoto[]> {
  // Pick 3 random images from the curated people list
  const shuffled = [...PEOPLE_IMAGE_IDS].sort(() => Math.random() - 0.5);
  const selectedIds = shuffled.slice(0, 6);
  
  const photos = await Promise.all(
    selectedIds.map(async (imageId, index) => {
      // Lorem Picsum with specific image ID that contains people
      const response = await fetch(`https://picsum.photos/id/${imageId}/1024/1024`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch placeholder image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Apply heavy blur to make unrecognizable
      const blurredBuffer = await sharp(buffer)
        .blur(200)
        .jpeg({ quality: 60 })
        .toBuffer();
      
      const blurredBase64 = blurredBuffer.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${blurredBase64}`;
      
      return {
        id: `preview-${Date.now()}-${index}`,
        dataUrl,
        slot: index,
      };
    })
  );
  
  return photos;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generatePreviewPhotos(
  formData: FormData
): Promise<GeneratePreviewPhotosResult> {
  try {
    console.log("PREVIEW_GENERATION_ENABLED", PREVIEW_GENERATION_ENABLED);
    // If preview generation is disabled, return placeholder blurred photos
    if (!PREVIEW_GENERATION_ENABLED) {
      const [result] = await Promise.allSettled([generatePlaceholderPhotos(), sleep(6_000)]);
      if (result.status === "fulfilled") {
        return {
          success: true,
          photos: result.value,
        }
      }
      return {
        success: false,
        error: result.reason instanceof Error ? result.reason.message : "Unknown error occurred",
      }
    }

    // Get the uploaded images, count, and prompt from formData
    const images = formData.getAll("images") as File[];

    // Hardcoded prompts for preview photos - varied scenarios for dating profile
    const previewPrompts = [
      "A warm, genuine smile in natural outdoor lighting, looking directly at the camera with confident eye contact",
      "An active outdoor photo showing personality - hiking, at the beach, or in a park with natural scenery",
      "A stylish, well-dressed photo at a social setting like a rooftop bar or restaurant, looking confident and fun",
    ];

    const files = await Promise.all(
      images.map(async (image) => await image.arrayBuffer())
    );

    // Generate preview photos with fast model - returns blurred base64
    const generatedPhotos = await Promise.all(previewPrompts.map(async (promptText, index) => {
        // Always use the hardcoded prompts for variety (ignore userPrompt for previews)
        const result = await generateImage({
          model: previewModel,
          prompt: {
            text: promptText,
            images: files,
          },
          size: "1024x1024",
        });
        
        // Apply heavy blur server-side using sharp (cannot be bypassed by client)
        const rawBuffer = Buffer.from(result.image.base64, "base64");
        const blurredBuffer = await sharp(rawBuffer)
          .blur(40) // Heavy blur - makes image unrecognizable but shows colors/shapes
          .jpeg({ quality: 60 }) // Lower quality for previews
          .toBuffer();
        
        // Return as data URL (no blob storage for ephemeral previews)
        const blurredBase64 = blurredBuffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${blurredBase64}`;

        return {
          id: `preview-${Date.now()}-${index}`,
          dataUrl,
          slot: index,
        };
      })
    );

    return {
      success: true,
      photos: generatedPhotos,
    };
  } catch (error) {
    console.error("Error generating preview photos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function compressImage(buffer: Buffer, mediaType: string): Promise<Buffer> {
  const image = sharp(buffer).resize(1000, 1000, { fit: "cover" });
  
  if (mediaType === "image/png") {
    // Lossless PNG compression with maximum effort
    return image.png({ compressionLevel: 3, effort: 10 }).toBuffer();
  } else if (mediaType === "image/webp") {
    // Lossless WebP
    return image.webp({ lossless: true }).toBuffer();
  } else {
    // For JPEG and others, use high quality (near-lossless)
    return image.jpeg({ quality: 95, mozjpeg: true }).toBuffer();
  }
}