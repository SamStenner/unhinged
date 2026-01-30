"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/lib/profile-context";
import { useAuth } from "@/lib/auth-context";
import { availablePrompts } from "@/lib/mock-data";
import PhotoGrid from "./PhotoGrid";
import AIPhotoUpload from "./AIPhotoUpload";
import WrittenPromptCard from "./WrittenPromptCard";
import AddPromptCard from "./AddPromptCard";
import ProfileVitals from "./ProfileVitals";
import { generatePhotos } from "@/app/actions/generate-photos";
import { Switch } from "./ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface EditViewProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

// Compress image on client side to avoid payload size limits
async function compressImage(file: File, maxSize = 1024, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // Draw to canvas and export as compressed JPEG
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function EditView({ onDragStart, onDragEnd }: EditViewProps) {
  const { user, signOut } = useAuth();
  const {
    photos,
    prompts,
    balance,
    removePhoto,
    removePrompt,
    addPrompt,
    swapPhotoSlots,
    updatePrompt,
    refreshFromDatabase,
  } = useProfile();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("showPrompts") === "true";
  });

  // Persist showPrompts to localStorage
  useEffect(() => {
    localStorage.setItem("showPrompts", String(showPrompts));
  }, [showPrompts]);

  const handleRemovePhoto = (id: string) => {
    removePhoto(id);
  };

  const handleAddPhoto = (slot: number) => {
    // For now, clicking empty slots does nothing - photos come from AI generation
  };

  const handleSwapSlots = (slotA: number, slotB: number) => {
    swapPhotoSlots(slotA, slotB);
  };

  const emptySlotCount = [0, 1, 2, 3, 4, 5].filter(
    (slot) => !photos.find((p) => p.slot === slot)
  ).length;

  const handleGenerateAIPhotos = async (images: File[], count: number, prompt: string) => {
    if (!user) {
      setGenerationError("Please sign in to generate photos");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Compress images on client side to avoid payload size limits
      const compressedImages = await Promise.all(
        images.map((image) => compressImage(image, 1024, 0.85))
      );

      const formData = new FormData();
      compressedImages.forEach((image) => {
        formData.append("images", image);
      });
      formData.append("count", String(count));
      formData.append("prompt", prompt);

      const result = await generatePhotos(formData);

      if (!result.success || !result.photos) {
        setGenerationError(result.error || "Failed to generate photos");
        setIsGenerating(false);
        return;
      }

      // Refresh from database to get the new photos and updated balance
      await refreshFromDatabase();
    } catch (error) {
      console.error("Error generating photos:", error);
      setGenerationError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddPrompt = () => {
    if (prompts.length >= 3) return;
    const usedPrompts = prompts.map((p) => p.prompt);
    const unusedPrompts = availablePrompts.filter(
      (p) => !usedPrompts.includes(p)
    );
    if (unusedPrompts.length === 0) return;

    const randomPromptText =
      unusedPrompts[Math.floor(Math.random() * unusedPrompts.length)];
    addPrompt({ prompt: randomPromptText, answer: "Edit this answer..." });
  };

  return (
    <div className="hide-scrollbar p-4">
      {/* My Photos Section */}
      <div className="">
        <h2 className="text-[15px] font-medium text-gray-600 mb-3">
          My Photos
        </h2>
        {photos.length === 0 ? (
          isGenerating ? (
            <div className="bg-white rounded-xl py-12 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#67295F]/5 to-transparent animate-shimmer" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#67295F]/10 flex items-center justify-center mb-4">
                  <svg
                    className="animate-spin h-8 w-8 text-[#67295F]"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <p className="text-[15px] font-medium text-[#67295F] mb-1">
                  Generating photos...
                </p>
                <p className="text-[13px] text-gray-400">
                  This may take a moment
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl py-12 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-[15px] font-medium text-gray-700 mb-1">
                No photos yet
              </p>
              <p className="text-[13px] text-gray-400">
                Upload photos above and generate your profile pictures
              </p>
            </div>
          )
        ) : (
          <div>
            <PhotoGrid
              photos={photos}
              onSwapSlots={handleSwapSlots}
              onRemovePhoto={handleRemovePhoto}
              onAddPhoto={handleAddPhoto}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isGenerating={isGenerating}
            />
            <div className="flex justify-end mt-2 px-1">
              <span className="text-[12px] text-gray-400">Drag to reorder</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Photos Button */}
      <div className="py-4">
        <AIPhotoUpload
          onGenerate={handleGenerateAIPhotos}
          isGenerating={isGenerating}
          emptySlotCount={emptySlotCount}
          balance={balance}
        />
        {generationError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{generationError}</p>
          </div>
        )}
      </div>

      {/* Profile Vitals Section */}
      <ProfileVitals className="py-8" />

      {false && <div className="space-y-5">

        {/* Show Prompts Toggle */}
        {<div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium">Show Prompts</h2>
          <Switch
            checked={showPrompts}
            onCheckedChange={setShowPrompts}
            className="data-[state=checked]:bg-[#67295F]"
          />
        </div>}

        {/* Written Prompts Section */}
        {showPrompts && (
          <div className="space-y-5">
            {prompts.map((prompt) => (
              <WrittenPromptCard
                key={prompt.id}
                prompt={prompt.prompt}
                answer={prompt.answer}
                onRemove={() => removePrompt(prompt.id)}
                onAnswerChange={(newAnswer) =>
                  updatePrompt(prompt.id, { answer: newAnswer })
                }
              />
            ))}
            {prompts.length < 3 && <AddPromptCard onClick={handleAddPrompt} />}
          </div>
        )}
      </div>}

      {/* Sign Out Button */}
      {user && (
        <div className="pt-8 pb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="w-full py-3 text-[15px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => signOut()}>
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
