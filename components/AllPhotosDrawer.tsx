"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "./ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { getGeneratedPhotosPaginated, type GeneratedPhotoWithSignedUrl } from "@/app/actions/db";
import { useProfile } from "@/lib/profile-context";
import { useIsMobile } from "@/lib/is-mobile";

interface AllPhotosDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "select";
  targetSlot?: number;
}

const PHOTOS_PER_PAGE = 15;

export default function AllPhotosDrawer({
  open,
  onOpenChange,
  mode,
  targetSlot,
}: AllPhotosDrawerProps) {
  const { setPhotoToSlot, photos: slottedPhotos } = useProfile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Use React Query for caching and pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["generated-photos"],
    queryFn: async ({ pageParam = 0 }) => {
      return getGeneratedPhotosPaginated(pageParam, PHOTOS_PER_PAGE);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: open, // Only fetch when drawer/dialog is open
  });

  // Flatten all pages into a single array
  const photos = data?.pages.flatMap((page) => page.photos) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const isLoading = isFetching && !isFetchingNextPage;

  // Get IDs of photos already in slots
  const slottedPhotoIds = new Set(slottedPhotos.map((p) => p.id));

  // Filter out slotted photos when in select mode
  const displayPhotos = mode === "select"
    ? photos.filter((p) => !slottedPhotoIds.has(p.id))
    : photos;

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const threshold = 200;

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePhotoClick = async (photo: GeneratedPhotoWithSignedUrl) => {
    if (mode === "view") return; // No action in view mode

    // Add to the target slot (pass the signed URL for immediate display)
    await setPhotoToSlot(photo.id, photo.url, photo.mediaType, targetSlot);
    onOpenChange(false);
  };

  const title = mode === "select" ? "Select Photo" : "All Generated Photos";
  const subtitle = mode === "select"
    ? "Tap a photo to add it to your profile"
    : `${total} ${total === 1 ? "photo" : "photos"} total`;

  const photosContent = (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4"
    >
      {displayPhotos.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
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
            {mode === "select" && photos.length > 0
              ? "All photos already added"
              : "No photos yet"}
          </p>
          <p className="text-[13px] text-gray-400">
            {mode === "select" && photos.length > 0
              ? "Generate more photos to add to your profile"
              : "Generate some photos to see them here"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {displayPhotos.map((photo) =>
              mode === "select" ? (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handlePhotoClick(photo)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-[#67295F] transition-all group"
                >
                  <Image
                    src={photo.url}
                    alt="Generated photo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 430px) 33vw, 140px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#67295F"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                  </div>
                </button>
              ) : (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  <Image
                    src={photo.url}
                    alt="Generated photo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 430px) 33vw, 140px"
                  />
                </div>
              )
            )}
          </div>

          {(isLoading || isFetchingNextPage) && (
            <div className="flex justify-center py-6">
              <svg
                className="animate-spin h-6 w-6 text-[#67295F]"
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
          )}
        </>
      )}
    </div>
  );

  // Desktop: use Dialog
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="lg:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between border-b p-4">
            <div className="items-start flex flex-col">
              <DialogTitle>{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </DialogHeader>
          {photosContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: use Drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="items-start flex flex-col">
            <DrawerTitle>{title}</DrawerTitle>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </DrawerClose>
        </DrawerHeader>
        {photosContent}
      </DrawerContent>
    </Drawer>
  );
}
