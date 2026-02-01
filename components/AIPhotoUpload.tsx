"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
  onGenerate: (images: File[], count: number, prompts: string[]) => void;
  isGenerating?: boolean;
  emptySlotCount?: number;
  balance?: number;
}

interface FormValues {
  photoCount: number;
  prompts: { value: string }[];
}

export default function AIPhotoUpload({
  onGenerate,
  isGenerating = false,
  emptySlotCount = 6,
  balance = 0,
}: AIPhotoUploadProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { uploadedImages, addUploadedImage, removeUploadedImage, clearUploadedImages } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog/drawer open state
  const [isOpen, setIsOpen] = useState(false);
  // Step 0 = upload step, steps 1-N = prompt for each photo
  const [step, setStep] = useState(0);

  const { control, watch, reset, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      photoCount: 3,
      prompts: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "prompts",
  });

  const photoCount = watch("photoCount");
  const isLastStep = step === photoCount;
  const currentPromptIndex = step - 1;

  const resetForm = () => {
    setStep(0);
    reset({ photoCount: 3, prompts: [] });
  };

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

  const handleContinue = () => {
    if (step === 0) {
      // Initialize prompts array for each photo
      replace(Array(photoCount).fill({ value: "" }));
      setStep(1);
    } else if (step < photoCount) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (step === 1) {
      // Go back to upload step
      setStep(0);
      replace([]);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (isGenerating && open) return;
    setIsOpen(open);
    if (!open) {
      // Reset form state when closing
      resetForm();
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = (data: FormValues) => {
    if (uploadedImages.length === 0) return;

    // Call onGenerate with prompts array
    const prompts = data.prompts.map((p) => p.value);
    onGenerate(uploadedImages.map((img) => img.file), data.photoCount, prompts);
    
    // Close dialog and reset form state (keep uploaded photos for next generation)
    setIsOpen(false);
    resetForm();
  };

  const petalCost = photoCount * 10;
  const insufficientBalance = user ? balance < petalCost : false;
  const photoCountLabel = `${photoCount} photo${photoCount !== 1 ? "s" : ""}`;

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

  // Step 0: Upload content with photo grid and slider
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

      {/* Photo count slider - always visible */}
      <div className="pt-2 sm:pt-0">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm text-gray-700">
            Generate {photoCountLabel}
          </Label>
          {user && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#67295F]/10 to-[#67295F]/5 rounded-full">
              <span className="text-xs">🌸</span>
              <span className="text-sm font-semibold text-[#67295F]">{petalCost}</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Controller
            name="photoCount"
            control={control}
            render={({ field }) => (
              <Slider
                min={1}
                max={6}
                step={1}
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
                className="w-full [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-[#67295F] [&_[data-slot=slider-thumb]]:border-[#67295F] [&_[data-slot=slider-thumb]]:size-5"
              />
            )}
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

  // Steps 1-N: Prompt input for each photo
  const promptContent = (
    <div className="space-y-4 sm:space-y-5">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: photoCount }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i + 1 === step
                ? "w-6 bg-[#67295F]"
                : i + 1 < step
                ? "w-1.5 bg-[#67295F]/40"
                : "w-1.5 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Photo number indicator */}
      <div className="text-center">
        <span className="text-sm text-gray-500">
          Describe photo {step} of {photoCount}
        </span>
      </div>

      {/* Prompt input */}
      <div>
        <Label className="hidden sm:block text-sm text-gray-700 mb-2">
          Photo description (optional)
        </Label>
        {currentPromptIndex >= 0 && currentPromptIndex < fields.length && (
          <Controller
            key={currentPromptIndex}
            name={`prompts.${currentPromptIndex}.value`}
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Describe what you want for this photo..."
                className="rounded-xl bg-gray-50 text-[14px] resize-none focus-visible:ring-[#67295F] focus-visible:border-[#67295F] shadow-none"
                rows={isMobile ? 4 : 3}
                autoFocus
              />
            )}
          />
        )}
        <p className="text-xs text-gray-400 mt-2">
          e.g., "Outdoor hiking photo with natural lighting" or "Professional headshot with a smile"
        </p>
      </div>
    </div>
  );

  const isContinueDisabled = uploadedImages.length === 0 || isGenerating;
  const isGenerateDisabled = uploadedImages.length === 0 || isGenerating || insufficientBalance;

  // Continue button for step 0
  const continueButton = (
    <button
      key="continue-btn"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        handleContinue();
      }}
      disabled={isContinueDisabled}
      className={`w-full sm:flex-1 py-3 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 ${isContinueDisabled
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-[#67295F] to-[#8B3A7F] text-white hover:from-[#5a2352] hover:to-[#7a3370]"
        }`}
    >
      Continue
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );

  // Next button for prompt steps (not last)
  const nextButton = (
    <button
      key="next-btn"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        handleContinue();
      }}
      className="w-full sm:flex-1 py-3 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#67295F] to-[#8B3A7F] text-white hover:from-[#5a2352] hover:to-[#7a3370]"
    >
      Next
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );

  // Generate button for last step
  const generateButton = (
    <button
      key="generate-btn"
      type="submit"
      disabled={isGenerateDisabled}
      className={`w-full sm:flex-1 py-3 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 ${isGenerateDisabled
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
          Generate {photoCountLabel}
        </>
      )}
    </button>
  );

  // Back button for prompt steps
  const backButton = (
    <button
      key="back-btn"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        handleBack();
      }}
      className="w-full sm:flex-1 py-3 rounded-xl font-medium text-[15px] text-gray-500 sm:text-gray-600 hover:bg-gray-100 sm:hover:bg-gray-50 transition-colors sm:border sm:border-gray-200 flex items-center justify-center gap-2"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back
    </button>
  );

  const cancelButton = (
    <button
      key="cancel-btn"
      type="button"
      className="w-full sm:flex-1 py-3 rounded-xl font-medium text-[15px] text-gray-500 sm:text-gray-600 hover:bg-gray-100 sm:hover:bg-gray-50 transition-colors sm:border sm:border-gray-200"
    >
      Cancel
    </button>
  );

  // Determine which content and buttons to show
  const isInPromptStep = step > 0;
  const currentContent = !isInPromptStep ? uploadContent : promptContent;
  const currentTitle = !isInPromptStep ? "Upload Photos" : `Photo ${step} Description`;
  const currentSubtitle = !isInPromptStep
    ? "Add your photos to generate profile pictures"
    : "Describe the style you want for this photo";

  // Determine primary action button
  const primaryButton = !isInPromptStep
    ? continueButton
    : isLastStep
    ? generateButton
    : nextButton;

  // Determine secondary button
  const secondaryButton = !isInPromptStep ? cancelButton : backButton;

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl">{currentTitle}</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {currentSubtitle}
              </p>
            </DialogHeader>
            <div className="py-2">{currentContent}</div>
            <DialogFooter className="flex-row gap-3 sm:flex-row pt-2">
              {!isInPromptStep ? (
                <DialogClose asChild>{secondaryButton}</DialogClose>
              ) : (
                secondaryButton
              )}
              {primaryButton}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader>
            <DrawerTitle>{currentTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-4 px-4">{currentContent}</div>
          <DrawerFooter>
            {primaryButton}
            {!isInPromptStep ? (
              <DrawerClose asChild>{secondaryButton}</DrawerClose>
            ) : (
              secondaryButton
            )}
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
