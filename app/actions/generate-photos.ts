"use server";

import { FilePart, generateText } from "ai";
import { put } from "@vercel/blob";
import { addGeneratedPhotos, setPhotoSlot, getUserProfile, deductBalance } from "./db";

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

export async function generatePhotos(
  formData: FormData
): Promise<GeneratePhotosResult> {
  try {
    // Get the uploaded images, count, and authId from formData
    const images = formData.getAll("images") as File[];
    const count = parseInt(formData.get("count") as string, 10) || 1;
    const authId = formData.get("authId") as string | null;

    if (!images.length) {
      return { success: false, error: "No images provided" };
    }

    if (count < 1 || count > 6) {
      return { success: false, error: "Count must be between 1 and 6" };
    }

    const cost = count * 10;

    // If authenticated, check balance before generating
    if (authId) {
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
    }

    const prompt = `Make a picture of the person in the uploaded photos, but for her dating/Hinge profile. Make her look happy, relaxed and confident.`;

    const files = await Promise.all(images.map(async (image) => ({ type: "file", mediaType: image.type, data: await image.arrayBuffer() }) as FilePart))

    const env = process.env.NODE_ENV;
    const model = env === "development" ? "google/gemini-2.5-flash-image" : "google/gemini-3-pro-image";

    // Generate the requested number of photos (no slot awareness)
    const generatedPhotosRaw = await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const result = await generateText({
          model,
          prompt: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...files
            ]
          }],
        });
        const [file] = result.files;
        
        // Convert base64 to buffer and upload to Vercel Blob
        const buffer = Buffer.from(file.base64, "base64");
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

    // If user is authenticated, save to database and assign to slots
    if (authId) {
      // Get current profile to find empty slots
      const profile = await getUserProfile(authId);
      const usedSlots = new Set(profile?.photos.map((p) => p.slot) ?? []);
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
    }

    // Not authenticated - return photos without database IDs
    return {
      success: true,
      photos: generatedPhotosRaw.map((p, i) => ({
        id: `temp-${Date.now()}-${i}`,
        url: p.url,
        mediaType: p.mediaType,
      })),
    };
  } catch (error) {
    console.error("Error generating photos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
