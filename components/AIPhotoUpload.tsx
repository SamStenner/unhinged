"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/lib/is-mobile";
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
import {
  saveUploadedImage,
  getAllUploadedImages,
  deleteUploadedImage,
  createBlobUrl,
} from "@/lib/indexeddb";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface AIPhotoUploadProps {
  onGenerate: (images: File[]) => void;
  isGenerating?: boolean;
}

export default function AIPhotoUpload({
  onGenerate,
  isGenerating = false,
}: AIPhotoUploadProps) {
  const isMobile = useIsMobile();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load uploaded images from IndexedDB on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const storedImages = await getAllUploadedImages();
        const images: UploadedImage[] = storedImages.map((stored) => ({
          id: stored.id,
          file: new File([stored.blob], stored.name, { type: stored.type }),
          preview: createBlobUrl(stored.blob),
        }));
        setUploadedImages(images);
      } catch (error) {
        console.error("Error loading uploaded images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        try {
          // Save to IndexedDB
          const stored = await saveUploadedImage(file);
          const preview = createBlobUrl(stored.blob);
          newImages.push({
            id: stored.id,
            file,
            preview,
          });
        } catch (error) {
          console.error("Error saving uploaded image:", error);
        }
      }
    }

    setUploadedImages((prev) => [...newImages, ...prev]);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (id: string) => {
    try {
      // Delete from IndexedDB
      await deleteUploadedImage(id);

      setUploadedImages((prev) => {
        const image = prev.find((img) => img.id === id);
        if (image) {
          URL.revokeObjectURL(image.preview);
        }
        return prev.filter((img) => img.id !== id);
      });
    } catch (error) {
      console.error("Error deleting uploaded image:", error);
    }
  };

  const handleGenerate = () => {
    if (uploadedImages.length === 0) return;
    onGenerate(uploadedImages.map((img) => img.file));
    setIsOpen(false);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const triggerButton = (
    <button
      type="button"
      className="w-full py-3 px-4 rounded-xl bg-white border-2 border-dashed border-[#67295F] flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
      disabled={isGenerating}
    >
      <div className="w-7 h-7 rounded-full bg-[#67295F] flex items-center justify-center">
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
      <span className="text-[15px] font-semibold text-[#67295F]">
        Upload Photos
      </span>
    </button>
  );

  const uploadContent = (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Horizontal scrolling image row */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth touch-pan-x">
        {/* Add button */}
        <button
          type="button"
          onClick={handleAddClick}
          className="shrink-0 w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:border-[#67295F] hover:bg-purple-50 transition-colors snap-start"
        >
          <div className="w-8 h-8 rounded-full bg-[#67295F] flex items-center justify-center mb-1">
            <svg
              width="16"
              height="16"
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
          <span className="text-[11px] text-gray-500">Add</span>
        </button>

        {/* Uploaded images */}
        <AnimatePresence mode="popLayout">
          {uploadedImages.map((image) => (
            <motion.div
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 w-28 h-28 rounded-lg overflow-hidden relative snap-start"
            >
              <Image
                src={image.preview}
                alt="Uploaded photo"
                fill
                className="object-cover"
                sizes="112px"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                aria-label="Remove photo"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the style of photos you want (optional)..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#67295F] focus:border-transparent"
          rows={3}
        />
      </div>
    </div>
  );

  const generateButton = (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={uploadedImages.length === 0 || isGenerating}
      className={`w-full py-3 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 ${uploadedImages.length === 0 || isGenerating
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-[#67295F] to-[#8B3A7F] text-white hover:from-[#5a2352] hover:to-[#7a3370]"
        }`}
    >
      {isGenerating ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
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
          Generating...
        </>
      ) : (
        <>
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
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Generate Photos
        </>
      )}
    </button>
  );

  // Desktop: Use Dialog with grid layout
  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Photos</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Add your photos to generate profile pictures
            </p>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Grid layout for desktop */}
            <div className="grid grid-cols-4 gap-3">
              {/* Add button - larger drop zone */}
              <button
                type="button"
                onClick={handleAddClick}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:border-[#67295F] hover:bg-purple-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#67295F] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg
                    width="20"
                    height="20"
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
                <span className="text-sm font-medium text-gray-600">Add Photos</span>
              </button>

              {/* Uploaded images */}
              <AnimatePresence mode="popLayout">
                {uploadedImages.map((image) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="aspect-square rounded-xl overflow-hidden relative group"
                  >
                    <Image
                      src={image.preview}
                      alt="Uploaded photo"
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      aria-label="Remove photo"
                    >
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style description (optional)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the style of photos you want..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#67295F] focus:border-transparent"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-row gap-3 sm:flex-row pt-2">
            <DialogClose asChild>
              <button
                type="button"
                className="flex-1 py-3 rounded-xl font-medium text-[15px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={uploadedImages.length === 0 || isGenerating}
              className={`flex-1 py-3 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 ${uploadedImages.length === 0 || isGenerating
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#67295F] to-[#8B3A7F] text-white hover:from-[#5a2352] hover:to-[#7a3370]"
                }`}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
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
                  Generating...
                </>
              ) : (
                <>
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
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generate Photos
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Drawer
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Upload Photos</DrawerTitle>
        </DrawerHeader>

        <div className="pb-4 px-4">{uploadContent}</div>

        <DrawerFooter>
          {generateButton}

          <DrawerClose asChild>
            <button
              type="button"
              className="w-full py-3 rounded-xl font-medium text-[15px] text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
