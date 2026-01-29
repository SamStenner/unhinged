"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile-context";
import ProfileInfo from "./ProfileInfo";
import ProfileImage from "./ProfileImage";
import PromptCard from "./PromptCard";
import { generatePhotos } from "@/app/actions/generate-photos";
import {
  getAllUploadedImages,
  saveGeneratedPhotos,
  deleteGeneratedPhotoBySlot,
  base64ToBlobUrl,
} from "@/lib/indexeddb";

export default function ViewContent() {
  const { profile, photos, prompts, addPhotoToSlot, removePhoto } =
    useProfile();
  const [regeneratingSlot, setRegeneratingSlot] = useState<number | null>(null);
  const [activeOverlaySlot, setActiveOverlaySlot] = useState<number | null>(
    null
  );

  // Get photos by slot, filtering out empty slots
  const getPhotoBySlot = (slot: number) => photos.find((p) => p.slot === slot);
  const sortedPrompts = [...prompts].sort((a, b) => a.order - b.order);

  const handleOverlayChange = (slot: number) => (active: boolean) => {
    setActiveOverlaySlot(active ? slot : null);
  };

  const handleRegenerate = async (slot: number) => {
    setActiveOverlaySlot(null);
    setRegeneratingSlot(slot);

    try {
      // Get uploaded images from IndexedDB
      const storedImages = await getAllUploadedImages();

      if (storedImages.length === 0) {
        console.error("No uploaded images found for regeneration");
        setRegeneratingSlot(null);
        return;
      }

      // Convert stored images to Files
      const imageFiles = storedImages.map(
        (stored) => new File([stored.blob], stored.name, { type: stored.type })
      );

      // Delete the existing photo from IndexedDB
      await deleteGeneratedPhotoBySlot(slot);

      // Find the photo to remove from context
      const photoToRemove = photos.find((p) => p.slot === slot);
      if (photoToRemove) {
        removePhoto(photoToRemove.id);
      }

      // Create FormData with images and just this slot
      const formData = new FormData();
      imageFiles.forEach((image) => {
        formData.append("images", image);
      });
      formData.append("slots", JSON.stringify([slot]));

      // Call the server action
      const result = await generatePhotos(formData);

      if (!result.success || !result.photos || result.photos.length === 0) {
        console.error("Failed to regenerate photo:", result.error);
        setRegeneratingSlot(null);
        return;
      }

      const generatedPhoto = result.photos[0];

      // Save to IndexedDB
      await saveGeneratedPhotos([
        {
          slot: generatedPhoto.slot,
          base64: generatedPhoto.image.base64,
          mediaType: generatedPhoto.image.mediaType,
        },
      ]);

      // Add to context
      addPhotoToSlot(slot, {
        src: base64ToBlobUrl(
          generatedPhoto.image.base64,
          generatedPhoto.image.mediaType
        ),
        alt: `Generated photo ${slot + 1}`,
      });
    } catch (error) {
      console.error("Error regenerating photo:", error);
    } finally {
      setRegeneratingSlot(null);
    }
  };

  return (
    <div className="hide-scrollbar pb-8">
      {/* Image 1 (slot 0) */}
      {getPhotoBySlot(0) && (
        <div className="relative">
          <ProfileImage
            src={getPhotoBySlot(0)!.src}
            alt={getPhotoBySlot(0)!.alt}
            slot={0}
            onRegenerate={handleRegenerate}
            isOverlayActive={activeOverlaySlot === 0}
            onOverlayChange={handleOverlayChange(0)}
          />
          {regeneratingSlot === 0 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Profile Info Section */}
      <ProfileInfo profile={profile} />

      {/* Image 2 (slot 1) */}
      {getPhotoBySlot(1) && (
        <div className="relative">
          <ProfileImage
            src={getPhotoBySlot(1)!.src}
            alt={getPhotoBySlot(1)!.alt}
            slot={1}
            onRegenerate={handleRegenerate}
            isOverlayActive={activeOverlaySlot === 1}
            onOverlayChange={handleOverlayChange(1)}
          />
          {regeneratingSlot === 1 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Prompt 1 */}
      {sortedPrompts[0] && (
        <PromptCard
          prompt={sortedPrompts[0].prompt}
          answer={sortedPrompts[0].answer}
        />
      )}

      {/* Image 3 (slot 2) */}
      {getPhotoBySlot(2) && (
        <div className="relative">
          <ProfileImage
            src={getPhotoBySlot(2)!.src}
            alt={getPhotoBySlot(2)!.alt}
            slot={2}
            onRegenerate={handleRegenerate}
            isOverlayActive={activeOverlaySlot === 2}
            onOverlayChange={handleOverlayChange(2)}
          />
          {regeneratingSlot === 2 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Image 4 (slot 3) */}
      {getPhotoBySlot(3) && (
        <div className="relative">
          <ProfileImage
            src={getPhotoBySlot(3)!.src}
            alt={getPhotoBySlot(3)!.alt}
            slot={3}
            onRegenerate={handleRegenerate}
            isOverlayActive={activeOverlaySlot === 3}
            onOverlayChange={handleOverlayChange(3)}
          />
          {regeneratingSlot === 3 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Prompt 2 */}
      {sortedPrompts[1] && (
        <PromptCard
          prompt={sortedPrompts[1].prompt}
          answer={sortedPrompts[1].answer}
        />
      )}

      {/* Image 5 (slot 4) */}
      {getPhotoBySlot(4) && (
        <div className="relative">
          <ProfileImage
            src={getPhotoBySlot(4)!.src}
            alt={getPhotoBySlot(4)!.alt}
            slot={4}
            onRegenerate={handleRegenerate}
            isOverlayActive={activeOverlaySlot === 4}
            onOverlayChange={handleOverlayChange(4)}
          />
          {regeneratingSlot === 4 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Prompt 3 */}
      {sortedPrompts[2] && (
        <PromptCard
          prompt={sortedPrompts[2].prompt}
          answer={sortedPrompts[2].answer}
        />
      )}

      {/* Image 6 (slot 5) */}
      {getPhotoBySlot(5) && (
        <div className="relative">
          <ProfileImage
            src={getPhotoBySlot(5)!.src}
            alt={getPhotoBySlot(5)!.alt}
            slot={5}
            onRegenerate={handleRegenerate}
            isOverlayActive={activeOverlaySlot === 5}
            onOverlayChange={handleOverlayChange(5)}
          />
          {regeneratingSlot === 5 && <RegeneratingOverlay />}
        </div>
      )}
    </div>
  );
}

function RegeneratingOverlay() {
  return (
    <div className="absolute inset-0 mx-4 my-3 rounded-2xl bg-black/60 flex flex-col items-center justify-center">
      <svg
        className="animate-spin h-10 w-10 text-white mb-3"
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
      <span className="text-white text-sm font-medium">Regenerating...</span>
    </div>
  );
}
