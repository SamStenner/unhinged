"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/lib/profile-context";
import { useAuth } from "@/lib/auth-context";
import ProfileInfo from "./ProfileInfo";
import ProfileImage from "./ProfileImage";
import PromptCard from "./PromptCard";
import { generatePhotos } from "@/app/actions/generate-photos";

export default function ViewContent() {
  const { user, openAuthModal } = useAuth();
  const { profile, photos, prompts, uploadedImages, refreshFromDatabase, previewPhotos } =
    useProfile();
  const [regeneratingSlot, setRegeneratingSlot] = useState<number | null>(null);
  const [activeOverlaySlot, setActiveOverlaySlot] = useState<number | null>(
    null
  );
  const [showPrompts, setShowPrompts] = useState(false);

  // Read showPrompts setting from localStorage
  useEffect(() => {
    setShowPrompts(localStorage.getItem("showPrompts") === "true");
  }, []);

  // Use preview photos when not signed in and they exist
  const displayPhotos = !user && previewPhotos.length > 0
    ? previewPhotos.map((p) => ({
        id: p.id,
        src: p.dataUrl,
        alt: "Preview photo",
        slot: p.slot,
      }))
    : photos;
  const isShowingPreviews = !user && previewPhotos.length > 0;

  // Get photos by slot, filtering out empty slots
  const getPhotoBySlot = (slot: number) => displayPhotos.find((p) => p.slot === slot);
  const sortedPrompts = [...prompts].sort((a, b) => a.order - b.order);

  // Check if profile has any content
  const hasPhotos = displayPhotos.length > 0;
  const hasVitals =
    profile.age !== undefined ||
    !!profile.gender ||
    !!profile.height ||
    !!profile.location;
  const hasPrompts = showPrompts && prompts.length > 0;
  const hasContent = hasPhotos || hasVitals || hasPrompts;

  const handleOverlayChange = (slot: number) => (active: boolean) => {
    setActiveOverlaySlot(active ? slot : null);
  };

  const handleRegenerate = async (slot: number) => {
    if (!user) {
      console.error("User must be authenticated to regenerate photos");
      return;
    }

    if (uploadedImages.length === 0) {
      console.error("No uploaded images found for regeneration");
      return;
    }

    setActiveOverlaySlot(null);
    setRegeneratingSlot(slot);

    try {
      // Get files from context
      const imageFiles = uploadedImages.map((img) => img.file);

      // Create FormData with images and just this slot
      const formData = new FormData();
      imageFiles.forEach((image) => {
        formData.append("images", image);
      });
      formData.append("count", "1");
      formData.append("targetSlot", String(slot));

      // Call the server action
      const result = await generatePhotos(formData);

      if (!result.success || !result.photos || result.photos.length === 0) {
        console.error("Failed to regenerate photo:", result.error);
        setRegeneratingSlot(null);
        return;
      }

      // Refresh from database to get the updated photo
      await refreshFromDatabase();
    } catch (error) {
      console.error("Error regenerating photo:", error);
    } finally {
      setRegeneratingSlot(null);
    }
  };

  // Show empty state if no content
  if (!hasContent) {
    return (
      <div className="hide-scrollbar pb-8 px-4 pt-8">
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-gray-700 mb-1">
            No profile yet
          </p>
          <p className="text-[13px] text-gray-400">
            Add some photos and generate your profile pictures
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hide-scrollbar">
      {/* Image 1 (slot 0) */}
      {getPhotoBySlot(0) && (
        <div className="relative">
          <ProfileImage
            src={getPhotoBySlot(0)!.src}
            alt={getPhotoBySlot(0)!.alt}
            slot={0}
            onRegenerate={isShowingPreviews ? undefined : handleRegenerate}
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
            onRegenerate={isShowingPreviews ? undefined : handleRegenerate}
            isOverlayActive={activeOverlaySlot === 1}
            onOverlayChange={handleOverlayChange(1)}
          />
          {regeneratingSlot === 1 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Prompt 1 */}
      {showPrompts && sortedPrompts[0] && (
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
            onRegenerate={isShowingPreviews ? undefined : handleRegenerate}
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
            onRegenerate={isShowingPreviews ? undefined : handleRegenerate}
            isOverlayActive={activeOverlaySlot === 3}
            onOverlayChange={handleOverlayChange(3)}
          />
          {regeneratingSlot === 3 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Prompt 2 */}
      {showPrompts && sortedPrompts[1] && (
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
            onRegenerate={isShowingPreviews ? undefined : handleRegenerate}
            isOverlayActive={activeOverlaySlot === 4}
            onOverlayChange={handleOverlayChange(4)}
          />
          {regeneratingSlot === 4 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Prompt 3 */}
      {showPrompts && sortedPrompts[2] && (
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
            onRegenerate={isShowingPreviews ? undefined : handleRegenerate}
            isOverlayActive={activeOverlaySlot === 5}
            onOverlayChange={handleOverlayChange(5)}
          />
          {regeneratingSlot === 5 && <RegeneratingOverlay />}
        </div>
      )}

      {/* Sign up CTA for preview photos */}
      {isShowingPreviews && (
        <div className="px-4 py-6">
          <button
            type="button"
            onClick={() => openAuthModal()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#67295F] to-[#8B3A7F] text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:from-[#5a2352] hover:to-[#7a3370] transition-all"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Sign up to unlock images
          </button>
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
