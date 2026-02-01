"use server";

import { FilePart, generateImage, generateText, Output } from "ai";
import { uploadToR2, getSignedUrl } from "@/lib/r2";
import { addGeneratedPhotos, setPhotoSlot, getUserProfile, deductBalance } from "./db";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { google } from "@ai-sdk/google";
import sharp from "sharp";
import { openai } from '@ai-sdk/openai';
import { examples, rules } from "./image-schema";

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
const isPro = true //env !== "development"
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

    // Get the uploaded images and prompts from formData
    const images = formData.getAll("images") as File[];
    const promptsJson = formData.get("prompts") as string;
    const prompts: string[] = promptsJson ? JSON.parse(promptsJson) : [];
    const count = prompts.length;

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

    const files = await Promise.all(images.map(async (image) => ({ type: "file", mediaType: image.type, data: await image.arrayBuffer() }) as FilePart))
    
    // Generate the requested number of photos (no slot awareness)
    const generatedPhotosRaw = await Promise.all(
      prompts.map(async (promptText) => {
        const system = `You are a dating profile photo generator. 
Attached are some photos of the user.
Rules: 
${rules}`  
        const text = await generatePhotoPrompt(files, promptText);
        const result = await generateText({
          model,
          system,
          prompt: [{
            role: "user",
            content: [
              ...files,
              { type: "text", text: JSON.stringify(text, null, 2) },
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

    // Get the uploaded images and prompts from formData
    const images = formData.getAll("images") as File[];
    const promptsJson = formData.get("prompts") as string;
    const prompts: string[] = promptsJson ? JSON.parse(promptsJson) : [];

    // Default prompts for preview photos if user didn't provide any
    const defaultPrompts = [
      "A warm, genuine smile in natural outdoor lighting, looking directly at the camera with confident eye contact",
      "An active outdoor photo showing personality - hiking, at the beach, or in a park with natural scenery",
      "A stylish, well-dressed photo at a social setting like a rooftop bar or restaurant, looking confident and fun",
      "A candid moment showing hobbies or interests in a natural setting",
      "A fun, playful photo that shows personality and sense of humor",
      "A well-lit portrait with a warm, approachable expression",
    ];

    const files = await Promise.all(
      images.map(async (image) => await image.arrayBuffer())
    );

    // Generate preview photos with fast model - returns blurred base64
    const generatedPhotos = await Promise.all(prompts.map(async (userPrompt, index) => {
        // Use user's prompt or fall back to default
        const promptText = userPrompt?.trim() || defaultPrompts[index % defaultPrompts.length];
        
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

const generatePhotoPrompt = async (files: FilePart[], promptText: string) => {
  const prompt = `You are a dating profile photo prompt generator. 
Your role is to output JSON that will be provided to a photo generation model.
Here are some examples of how to format a prompt into JSON:

${examples.map((example) => `
Example: ${JSON.stringify(example)}
`).join("\n")}

The JSON should aim to try and make a photo that is realistic for dating.
This doesn't mean it should be professional-photographer style, it means it should look like it was shot on an iPhone.

Rules:
${rules}

Make sure to follow the rules, examples, and the user's prompt. `
  const json = await generateText({
    model: google("gemini-2.5-flash"),
    system: prompt,
    prompt: [{
      role: "user",
      content: [
        ...files,
        { type: "text", text: `User's Prompt: ${promptText}` },
      ]
    }],
    output: Output.json({
      name: "photo_prompt",
      description: "A JSON object that will be provided to a photo generation model.",
    })
  });
  return json.output;
}