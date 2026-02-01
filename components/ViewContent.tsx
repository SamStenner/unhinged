"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/lib/profile-context";
import { useAuth } from "@/lib/auth-context";
import ProfileInfo from "./ProfileInfo";
import ProfileImage from "./ProfileImage";
import PromptCard from "./PromptCard";

export default function ViewContent() {
  const { user, openAuthModal } = useAuth();
  const { profile, photos, prompts, previewPhotos } =
    useProfile();
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
        <ProfileImage
          src={getPhotoBySlot(0)!.src}
          alt={getPhotoBySlot(0)!.alt}
          slot={0}
          isOverlayActive={activeOverlaySlot === 0}
          onOverlayChange={handleOverlayChange(0)}
          isPreview={isShowingPreviews}
        />
      )}

      {/* Profile Info Section */}
      <ProfileInfo profile={profile} />

      {/* Image 2 (slot 1) */}
      {getPhotoBySlot(1) && (
        <ProfileImage
          src={getPhotoBySlot(1)!.src}
          alt={getPhotoBySlot(1)!.alt}
          slot={1}
          isOverlayActive={activeOverlaySlot === 1}
          onOverlayChange={handleOverlayChange(1)}
          isPreview={isShowingPreviews}
        />
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
        <ProfileImage
          src={getPhotoBySlot(2)!.src}
          alt={getPhotoBySlot(2)!.alt}
          slot={2}
          isOverlayActive={activeOverlaySlot === 2}
          onOverlayChange={handleOverlayChange(2)}
          isPreview={isShowingPreviews}
        />
      )}

      {/* Image 4 (slot 3) */}
      {getPhotoBySlot(3) && (
        <ProfileImage
          src={getPhotoBySlot(3)!.src}
          alt={getPhotoBySlot(3)!.alt}
          slot={3}
          isOverlayActive={activeOverlaySlot === 3}
          onOverlayChange={handleOverlayChange(3)}
          isPreview={isShowingPreviews}
        />
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
        <ProfileImage
          src={getPhotoBySlot(4)!.src}
          alt={getPhotoBySlot(4)!.alt}
          slot={4}
          isOverlayActive={activeOverlaySlot === 4}
          onOverlayChange={handleOverlayChange(4)}
          isPreview={isShowingPreviews}
        />
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
        <ProfileImage
          src={getPhotoBySlot(5)!.src}
          alt={getPhotoBySlot(5)!.alt}
          slot={5}
          isOverlayActive={activeOverlaySlot === 5}
          onOverlayChange={handleOverlayChange(5)}
          isPreview={isShowingPreviews}
        />
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
            Sign up to unlock your photos
          </button>
        </div>
      )}
    </div>
  );
}

