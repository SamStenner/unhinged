"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, RefreshCw, type LucideIcon } from "lucide-react";
import { useIsMobile } from "@/lib/is-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OverlayButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}

function OverlayButton({ icon: Icon, label, onClick }: OverlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-800" />
      </div>
      <span className="text-white text-sm font-medium">{label}</span>
    </button>
  );
}

interface ProfileImageProps {
  src: string;
  alt: string;
  slot?: number;
  onRegenerate?: (slot: number) => void;
  isOverlayActive?: boolean;
  onOverlayChange?: (active: boolean) => void;
}

export default function ProfileImage({
  src,
  alt,
  slot,
  onRegenerate,
  isOverlayActive,
  onOverlayChange,
}: ProfileImageProps) {
  const isMobile = useIsMobile();

  // Use internal state if not controlled externally
  const [internalShowOverlay, setInternalShowOverlay] = useState(false);
  const showOverlay = isOverlayActive ?? internalShowOverlay;
  const setShowOverlay = onOverlayChange ?? setInternalShowOverlay;

  // Hover state for desktop
  const [isHovered, setIsHovered] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // On mobile, use click to toggle overlay
  // On desktop, use hover
  const isOverlayVisible = isMobile ? showOverlay : isHovered;

  const handleImageClick = () => {
    // Only toggle overlay on click for mobile
    if (isMobile) {
      setShowOverlay(true);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === e.currentTarget && isMobile) {
      setShowOverlay(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `photo-${slot ?? "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }

    if (isMobile) {
      setShowOverlay(false);
    }
  };

  const handleRegenerateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmRegenerate = () => {
    if (slot !== undefined && onRegenerate) {
      onRegenerate(slot);
    }
    setShowConfirmDialog(false);
    if (isMobile) {
      setShowOverlay(false);
    }
  };

  return (
    <div className="mx-4 my-3">
      <div
        className={`relative w-full aspect-4/5 rounded-2xl overflow-hidden bg-gray-200 ${isMobile ? "cursor-pointer" : ""}`}
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

        {/* Scrim overlay with buttons - always rendered for fade animation */}
        <div
          className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-4 transition-opacity duration-150 ${isOverlayVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          onClick={handleOverlayClick}
        >
          <OverlayButton
            icon={Download}
            label="Download"
            onClick={handleDownload}
          />

          {slot !== undefined && onRegenerate && (
            <OverlayButton
              icon={RefreshCw}
              label="Regenerate"
              onClick={handleRegenerateClick}
            />
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="mx-4 max-w-[calc(100%-2rem)] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current photo with a new AI-generated one.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegenerate}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
