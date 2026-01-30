"use server";

import { FilePart, generateText } from "ai";
import { put } from "@vercel/blob";

export interface GeneratedPhoto {
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
    // Get the uploaded images and count from formData
    const images = formData.getAll("images") as File[];
    const count = parseInt(formData.get("count") as string, 10) || 1;

    if (!images.length) {
      return { success: false, error: "No images provided" };
    }

    if (count < 1 || count > 6) {
      return { success: false, error: "Count must be between 1 and 6" };
    }

    const prompt = `Make a picture of the person in the uploaded photos, but for her dating/Hinge profile. Make her look happy, relaxed and confident.`;

    const files = await Promise.all(images.map(async (image) => ({ type: "file", mediaType: image.type, data: await image.arrayBuffer() }) as FilePart))

    const env = process.env.NODE_ENV;
    const model = env === "development" ? "google/gemini-2.5-flash-image" : "google/gemini-3-pro-image";

    // Generate the requested number of photos (no slot awareness)
    const generatedPhotos: GeneratedPhoto[] = await Promise.all(
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
