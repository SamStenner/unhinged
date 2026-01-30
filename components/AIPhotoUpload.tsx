"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/lib/is-mobile";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-context";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface AIPhotoUploadProps {
  onGenerate: (images: File[], count: number) => void;
  isGenerating?: boolean;
  emptySlotCount?: number;
  balance?: number;
}

export default function AIPhotoUpload({
  onGenerate,
  isGenerating = false,
  emptySlotCount = 6,
  balance = 0,
}: AIPhotoUploadProps) {
  const isMobile = useIsMobile();
  const { user, openAuthModal, pendingAction, clearPendingAction } = useAuth();
  const { uploadedImages, addUploadedImage, removeUploadedImage } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [photoCount, setPhotoCount] = useState(Math.min(3, 6));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        addUploadedImage(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    removeUploadedImage(id);
  };

  const handleGenerate = () => {
    if (uploadedImages.length === 0) return;

    // If user is not signed in, open auth modal with pending action
    if (!user) {
      openAuthModal({
        type: "generate",
        data: {
          images: uploadedImages.map((img) => img.file),
          count: photoCount,
        },
      });
      setIsOpen(false);
      return;
    }

    onGenerate(uploadedImages.map((img) => img.file), photoCount);
    setIsOpen(false);
  };

  // Resume generation after successful sign-in
  useEffect(() => {
    if (user && pendingAction?.type === "generate") {
      const { images, count } = pendingAction.data;
      onGenerate(images, count);
      clearPendingAction();
    }
  }, [user, pendingAction, onGenerate, clearPendingAction]);

  const handleOpenChange = (open: boolean) => {
    if (isGenerating && open) return;
    setIsOpen(open);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const petalCost = photoCount * 10;
  const insufficientBalance = user ? balance < petalCost : false;
  const photoCountLabel = `Generate ${photoCount} photo${photoCount !== 1 ? "s" : ""}`;

  const triggerButton = (
    <button
      type="button"
      className={`w-full py-3 px-4 rounded-xl bg-white border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${isGenerating
        ? "border-gray-300 cursor-not-allowed opacity-50"
        : "border-[#67295F] hover:bg-purple-50"
        }`}
      disabled={isGenerating}
      onClick={(e) => {
        if (isGenerating) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isGenerating ? "bg-gray-400" : "bg-[#67295F]"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span className={`text-[15px] font-semibold ${isGenerating ? "text-gray-400" : "text-[#67295F]"}`}>
        Upload Photos
      </span>
    </button>
  );

  // Shared content - responsive via Tailwind
  const uploadContent = (
    <div className="space-y-4 sm:space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth touch-pan-x sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0">
        <button
          type="button"
          onClick={handleAddClick}
          className="shrink-0 w-28 h-28 sm:w-auto sm:h-auto sm:aspect-square rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:border-[#67295F] hover:bg-purple-50 transition-colors snap-start group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#67295F] flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="text-[11px] sm:text-sm text-gray-500 sm:font-medium sm:text-gray-600">
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Photos</span>
          </span>
        </button>

        <AnimatePresence mode="popLayout">
          {uploadedImages.map((image) => (
            <motion.div
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 w-28 h-28 sm:w-auto sm:h-auto sm:aspect-square rounded-lg sm:rounded-xl overflow-hidden relative snap-start group"
            >
              <Image
                src={image.preview}
                alt="Uploaded photo"
                fill
                className="object-cover"
                sizes="(min-width: 640px) 150px, 112px"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-1 right-1 sm:top-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 bg-black/60 rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/80"
                aria-label="Remove photo"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Prompt input */}
      <div>
        <Label className="hidden sm:block text-sm text-gray-700 mb-2">
          Style description (optional)
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the style of photos you want (optional)..."
          className="rounded-xl bg-gray-50 text-[14px] resize-none focus-visible:ring-[#67295F] focus-visible:border-[#67295F]"
          rows={isMobile ? 3 : 2}
        />
      </div>

      {/* Photo count slider */}
      <div className="pt-2 sm:pt-0">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm text-gray-700">
            {photoCountLabel}
          </Label>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#67295F]/10 to-[#67295F]/5 rounded-full">
            <span className="text-xs">🌸</span>
            <span className="text-sm font-semibold text-[#67295F]">{petalCost}</span>
          </div>
        </div>
        <div className="relative">
          <Slider
            min={1}
            max={6}
            step={1}
            value={[photoCount]}
            onValueChange={(value) => setPhotoCount(value[0])}
            className="w-full [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-[#67295F] [&_[data-slot=slider-thumb]]:border-[#67295F] [&_[data-slot=slider-thumb]]:size-5"
          />
          <div className="flex justify-between mt-2 px-0.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                className={`text-xs ${photoCount === n ? "text-[#67295F] font-semibold" : "text-gray-400"}`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const isButtonDisabled = uploadedImages.length === 0 || isGenerating || insufficientBalance;

  const generateButton = (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isButtonDisabled}
      className={`w-full sm:flex-1 py-3 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 ${isButtonDisabled
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-[#67295F] to-[#8B3A7F] text-white hover:from-[#5a2352] hover:to-[#7a3370]"
        }`}
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating...
        </>
      ) : insufficientBalance ? (
        <>
          <span className="text-sm">🌸</span>
          Not enough petals
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          {photoCountLabel}
        </>
      )}
    </button>
  );

  const cancelButton = (
    <button
      type="button"
      className="w-full sm:flex-1 py-3 rounded-xl font-medium text-[15px] text-gray-500 sm:text-gray-600 hover:bg-gray-100 sm:hover:bg-gray-50 transition-colors sm:border sm:border-gray-200"
    >
      Cancel
    </button>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Photos</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Add your photos to generate profile pictures
            </p>
          </DialogHeader>
          <div className="py-2">{uploadContent}</div>
          <DialogFooter className="flex-row gap-3 sm:flex-row pt-2">
            <DialogClose asChild>{cancelButton}</DialogClose>
            {generateButton}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Upload Photos</DrawerTitle>
        </DrawerHeader>
        <div className="pb-4 px-4">{uploadContent}</div>
        <DrawerFooter>
          {generateButton}
          <DrawerClose asChild>{cancelButton}</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
