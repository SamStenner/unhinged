"use client";

import { useIsMobile } from "@/lib/is-mobile";
import { Skeleton } from "./ui/skeleton";

function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={i}
          className={cn(
            "aspect-[3/4] rounded-lg",
            i === 0 && "rounded-tl-xl",
            i === 2 && "rounded-tr-xl",
            i === 3 && "rounded-bl-xl",
            i === 5 && "rounded-br-xl"
          )}
        />
      ))}
    </div>
  );
}

function VitalsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-24" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EditViewSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Photos section */}
      <div>
        <Skeleton className="h-5 w-20 mb-3" />
        <PhotoGridSkeleton />
      </div>

      {/* Upload button */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Vitals section */}
      <div className="py-4">
        <VitalsSkeleton />
      </div>
    </div>
  );
}

function ViewContentSkeleton() {
  return (
    <div className="pb-8">
      {/* Main image */}
      <div className="px-4 pt-3">
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
      </div>

      {/* Profile info */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* More images */}
      <div className="px-4 space-y-4">
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ProfileSkeleton() {
  const isMobile = useIsMobile();

  // Desktop skeleton
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-muted">
        {/* Desktop Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-[900px] mx-auto relative flex items-center justify-between px-6 py-3">
            <div className="size-5" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </header>

        {/* Side-by-side panels */}
        <div className="max-w-[900px] mx-auto flex gap-6 p-6">
          <div className="flex-1 max-w-[430px]">
            <div className="bg-white rounded-xl border border-border">
              <div className="px-4 py-3 border-b border-border">
                <Skeleton className="h-5 w-10 mx-auto" />
              </div>
              <EditViewSkeleton />
            </div>
          </div>
          <div className="flex-1 max-w-[430px]">
            <div className="bg-white rounded-xl border border-border">
              <div className="px-4 py-3 border-b border-border">
                <Skeleton className="h-5 w-10 mx-auto" />
              </div>
              <ViewContentSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile skeleton
  return (
    <div className="max-w-[430px] mx-auto bg-[#f5f5f5]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white">
        {/* Top row */}
        <div className="relative flex items-center justify-between px-4 pt-3 pb-2">
          <div className="size-5" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>

        {/* Tab row */}
        <div className="flex border-b border-gray-200">
          <div className="flex-1 py-3 flex justify-center">
            <Skeleton className="h-5 w-10" />
          </div>
          <div className="flex items-center justify-center px-2">
            <span className="text-gray-300 text-lg">/</span>
          </div>
          <div className="flex-1 py-3 flex justify-center">
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="bg-white">
        <EditViewSkeleton />
      </div>
    </div>
  );
}
