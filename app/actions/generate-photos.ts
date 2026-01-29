"use server";

import { FilePart, generateText } from "ai";
import { put } from "@vercel/blob";

export interface GeneratedPhoto {
  slot: number;
  url: string;
  mediaType: string;
}

export interface GeneratePhotosResult {
  success: boolean;
  photos?: GeneratedPhoto[];
  error?: string;
}

export async function generatePhotos(
  formData: FormData
): Promise<GeneratePhotosResult> {
  try {
    // Get the uploaded images from formData
    const images = formData.getAll("images") as File[];
    const slotsJson = formData.get("slots") as string;
    const slots = JSON.parse(slotsJson) as number[];

    if (!images.length) {
      return { success: false, error: "No images provided" };
    }

    if (!slots.length) {
      return { success: false, error: "No slots to fill" };
    }

    const prompt = `Make a picture of the person in the uploaded photos, but for her dating/Hinge profile. Make her look happy, relaxed and confident.`;

    const files = await Promise.all(images.map(async (image) => ({ type: "file", mediaType: image.type, data: await image.arrayBuffer() }) as FilePart))

    const env = process.env.NODE_ENV;
    const model = env === "development" ? "google/gemini-2.5-flash-image" : "google/gemini-3-pro-image";

    const generatedPhotos: GeneratedPhoto[] = await Promise.all(slots.map(async (slot) => {
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
      const filename = `generated-${slot}-${Date.now()}.${extension}`;
      
      const blob = await put(filename, buffer, {
        access: "public",
        contentType: file.mediaType,
      });

      return {
        slot,
        url: blob.url,
        mediaType: file.mediaType,
      };
    }));

    return {
      success: true,
      photos: generatedPhotos,
    };
  } catch (error) {
    console.error("Error generating photos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
