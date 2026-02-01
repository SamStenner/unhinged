"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Lock } from "lucide-react";
import { useIsMobile } from "@/lib/is-mobile";

interface ProfileImageProps {
  src: string;
  alt: string;
  slot?: number;
  isOverlayActive?: boolean;
  onOverlayChange?: (active: boolean) => void;
  isPreview?: boolean;
}

export default function ProfileImage({
  src,
  alt,
  slot,
  isOverlayActive,
  onOverlayChange,
  isPreview = false,
}: ProfileImageProps) {
  const isMobile = useIsMobile();

  // Use internal state if not controlled externally
  const [internalShowOverlay, setInternalShowOverlay] = useState(false);
  const showOverlay = isOverlayActive ?? internalShowOverlay;
  const setShowOverlay = onOverlayChange ?? setInternalShowOverlay;

  // Hover state for desktop
  const [isHovered, setIsHovered] = useState(false);

  // On mobile, use click to toggle overlay
  // On desktop, use hover
  const isOverlayVisible = isMobile ? showOverlay : isHovered;

  const handleImageClick = () => {
    // Only toggle overlay on click for mobile
    if (isMobile) {
      setShowOverlay(true);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Use Next.js image optimization endpoint to avoid CORS issues
      const imageUrl = `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=100`;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `photo-${slot ?? "image"}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback to opening in new tab
      window.open(src, "_blank");
    }

    if (isMobile) {
      setShowOverlay(false);
    }
  };

  return (
    <div className="mx-4 my-3">
      <div
        className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-200 ${isMobile ? "cursor-pointer" : ""}`}
        onClick={handleImageClick}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 430px) 100vw, 430px"
        />

        {/* Download overlay - only show when not in preview mode */}
        {!isPreview && (
          <button
            type="button"
            className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity duration-150 cursor-pointer ${isOverlayVisible ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            onClick={handleDownload}
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <Download className="w-6 h-6 text-gray-800" />
            </div>
            <span className="text-white text-sm font-medium">Download</span>
          </button>
        )}

        {/* Locked overlay for preview mode */}
        {isPreview && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-sm font-medium text-center px-4">
              Sign up to unlock your photos
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
