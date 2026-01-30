"use server";

import { FilePart, generateText, Output } from "ai";
import { put } from "@vercel/blob";
import { addGeneratedPhotos, setPhotoSlot, getUserProfile, deductBalance } from "./db";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { google } from "@ai-sdk/google";
import sharp from "sharp";
import { z } from "zod";

async function compressImage(buffer: Buffer, mediaType: string): Promise<Buffer> {
  const image = sharp(buffer).resize(500, 500, { fit: "cover" });
  
  if (mediaType === "image/png") {
    // Lossless PNG compression with maximum effort
    return image.png({ compressionLevel: 9, effort: 10 }).toBuffer();
  } else if (mediaType === "image/webp") {
    // Lossless WebP
    return image.webp({ lossless: true }).toBuffer();
  } else {
    // For JPEG and others, use high quality (near-lossless)
    return image.jpeg({ quality: 95, mozjpeg: true }).toBuffer();
  }
}

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

        console.log("File size:", file.base64.length);
        
        // Convert base64 to buffer, compress, and upload to Vercel Blob
        const rawBuffer = Buffer.from(file.base64, "base64");
        const buffer = await compressImage(rawBuffer, file.mediaType);
        console.log("Compressed file size:", buffer.length);
        const extension = file.mediaType.split("/")[1] || "png";
        const filename = `generated-${Date.now()}-${index}.${extension}`;
        
        const blob = await put(filename, buffer, {
          access: "public",
          contentType: file.mediaType,
        });

        return {
          url: blob.url,
          mediaType: file.mediaType,
        };
      })
    );

    // Get current profile to find empty slots
    const updatedProfile = await getUserProfile(authId);
    const usedSlots = new Set(updatedProfile?.photos.map((p) => p.slot) ?? []);
    const emptySlots = [0, 1, 2, 3, 4, 5].filter((s) => !usedSlots.has(s));

    // Save all generated photos to database
    const savedPhotos = await addGeneratedPhotos(
      authId,
      generatedPhotosRaw.map((p) => ({
        url: p.url,
        mediaType: p.mediaType,
      }))
    );

    // Assign photos to empty slots
    const photosWithSlots: GeneratedPhoto[] = [];
    for (let i = 0; i < savedPhotos.length; i++) {
      const photo = savedPhotos[i];
      const slot = emptySlots[i];

      if (slot !== undefined) {
        await setPhotoSlot(authId, photo.id, slot);
        photosWithSlots.push({
          id: photo.id,
          url: photo.url,
          mediaType: photo.mediaType,
          slot,
        });
      } else {
        // No empty slot available, just return photo without slot
        photosWithSlots.push({
          id: photo.id,
          url: photo.url,
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
