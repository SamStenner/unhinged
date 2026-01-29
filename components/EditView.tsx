"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/lib/profile-context";
import { availablePrompts } from "@/lib/mock-data";
import PhotoGrid from "./PhotoGrid";
import AIPhotoUpload from "./AIPhotoUpload";
import { generatePhotos } from "@/app/actions/generate-photos";
import {
  getAllGeneratedPhotos,
  saveGeneratedPhotos,
  deleteGeneratedPhotoBySlot,
  swapGeneratedPhotoSlots,
} from "@/lib/indexeddb";
import { Switch } from "./ui/switch";

function WrittenPromptCard({
  prompt,
  answer,
  onRemove,
  onAnswerChange,
}: {
  prompt: string;
  answer: string;
  onRemove: () => void;
  onAnswerChange: (newAnswer: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(answer);

  const handleSave = () => {
    onAnswerChange(editValue);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 relative">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center"
        aria-label="Remove prompt"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#999"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <p className="text-[15px] font-semibold text-black pr-6 mb-1">{prompt}</p>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full text-[14px] text-gray-700 leading-snug border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#67295F] focus:border-transparent"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setEditValue(answer);
                setIsEditing(false);
              }}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-[#67295F] text-white rounded-lg hover:bg-[#5a2352]"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-left w-full"
        >
          <p className="text-[14px] text-gray-500 leading-snug hover:text-gray-700 transition-colors">
            {answer}
          </p>
        </button>
      )}
    </div>
  );
}

function AddPromptCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-dashed border-[#67295F] bg-white p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
    >
      <div>
        <p className="text-[15px] font-semibold text-black text-left">
          Select a prompt
        </p>
        <p className="text-[14px] text-gray-400 italic text-left">
          And write your answer
        </p>
      </div>
      <div className="w-7 h-7 rounded-full bg-[#67295F] flex items-center justify-center shrink-0">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    </button>
  );
}

interface EditViewProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function EditView({ onDragStart, onDragEnd }: EditViewProps) {
  const {
    photos,
    prompts,
    removePhoto,
    removePrompt,
    addPhotosToSlots,
    addPrompt,
    swapPhotoSlots,
    updatePrompt,
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

  // Load generated photos from IndexedDB on mount
  useEffect(() => {
    const loadGeneratedPhotos = async () => {
      try {
        const storedPhotos = await getAllGeneratedPhotos();
        if (storedPhotos.length > 0) {
          const photosToAdd = storedPhotos.map((stored) => ({
            slot: stored.slot,
            photo: {
              src: stored.url,
              alt: `Generated photo ${stored.slot + 1}`,
            },
          }));
          addPhotosToSlots(photosToAdd);
        }
      } catch (error) {
        console.error("Error loading generated photos:", error);
      }
    };

    loadGeneratedPhotos();
  }, [addPhotosToSlots]);

  const handleRemovePhoto = async (id: string) => {
    // Find the photo to get its slot
    const photo = photos.find((p) => p.id === id);
    if (photo) {
      try {
        // Delete from IndexedDB
        await deleteGeneratedPhotoBySlot(photo.slot);
      } catch (error) {
        console.error("Error deleting photo from IndexedDB:", error);
      }
    }
    // Remove from context
    removePhoto(id);
  };

  const handleAddPhoto = (slot: number) => {
    // For now, clicking empty slots does nothing - photos come from AI generation
    // Could add manual upload functionality here later
  };

  const handleSwapSlots = async (slotA: number, slotB: number) => {
    // Update context
    swapPhotoSlots(slotA, slotB);

    // Sync to IndexedDB
    try {
      await swapGeneratedPhotoSlots(slotA, slotB);
    } catch (error) {
      console.error("Error syncing slot swap to IndexedDB:", error);
    }
  };

  const handleGenerateAIPhotos = async (images: File[]) => {
    setIsGenerating(true);
    setGenerationError(null);

    // Find all empty slots - we'll generate an image for each one
    const emptySlots = [0, 1, 2, 3, 4, 5].filter(
      (slot) => !photos.find((p) => p.slot === slot)
    );

    if (emptySlots.length === 0) {
      setIsGenerating(false);
      return;
    }

    try {
      // Create FormData with images and slots
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });
      formData.append("slots", JSON.stringify(emptySlots));

      // Call the server action
      const result = await generatePhotos(formData);

      if (!result.success || !result.photos) {
        setGenerationError(result.error || "Failed to generate photos");
        setIsGenerating(false);
        return;
      }

      // Save to IndexedDB
      await saveGeneratedPhotos(
        result.photos.map((photo) => ({
          slot: photo.slot,
          url: photo.url,
          mediaType: photo.mediaType,
        }))
      );

      // Add photos to the profile context
      const photosToAdd = result.photos.map((photo) => ({
        slot: photo.slot,
        photo: {
          src: photo.url,
          alt: `Generated photo ${photo.slot + 1}`,
        },
      }));

      addPhotosToSlots(photosToAdd);
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
    // Get prompts that aren't already in use
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
    <div className="hide-scrollbar bg-white ">
      {/* My Photos Section */}
      <div className="px-4 pt-2 pb-2">
        <h2 className="text-[15px] font-medium text-gray-600 mb-3">
          My Photos
        </h2>
        {photos.length === 0 ? (
          isGenerating ? (
            <div className="bg-white rounded-xl py-12 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Shimmer overlay */}
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
          <>
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
          </>
        )}
      </div>

      {/* Upload Photos Button */}
      <div className="px-4 pt-4 pb-2">
        <AIPhotoUpload
          onGenerate={handleGenerateAIPhotos}
          isGenerating={isGenerating}
        />
        {generationError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{generationError}</p>
          </div>
        )}
      </div>

      <div className="p-4 flex items-center justify-between pt-10">
        <h2 className="text-[15px] font-medium">Show Prompts</h2>
        <Switch
          checked={showPrompts}
          onCheckedChange={setShowPrompts}
          className="data-[state=checked]:bg-[#67295F]"
        />
      </div>

      {/* Written Prompts Section */}
      {showPrompts && <div className="px-4 pt-4">
        <h2 className="text-[15px] font-medium text-gray-600 mb-3">
          Written Prompts ({prompts.length})
        </h2>
        <div className="space-y-2">
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
      </div>}
    </div>
  );
}
