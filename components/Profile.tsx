"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile-context";
import { useIsMobile } from "@/lib/is-mobile";
import ProfileHeader from "./ProfileHeader";
import SwipeableViews from "./SwipeableViews";
import EditView from "./EditView";
import ViewContent from "./ViewContent";

export default function Profile() {
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0); // 0 = Edit, 1 = View
  const [isDragging, setIsDragging] = useState(false);

  const handleTabChange = (tab: "edit" | "view") => {
    setActiveIndex(tab === "edit" ? 0 : 1);
  };

  const handleSwipe = (index: number) => {
    setActiveIndex(index);
  };

  // Desktop: Side-by-side layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-muted">
        {/* Desktop Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-[900px] mx-auto flex items-center justify-between px-6 py-3">
            <button
              type="button"
              className="text-[#67295F] font-medium text-base"
            >
              Cancel
            </button>
            <h1 className="text-xl font-semibold text-primary">Unhinged</h1>
            <button
              type="button"
              className="text-[#67295F] font-semibold text-base"
            >
              Done
            </button>
          </div>
        </div>

        {/* Side-by-side panels */}
        <div className="pt-[60px] max-w-[900px] mx-auto flex gap-6 p-6">
          {/* Edit Panel */}
          <div className="flex-1 max-w-[430px]">
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-[15px] font-semibold text-primary text-center">Edit</h2>
              </div>
              <div className="max-h-[calc(100vh-140px)] overflow-y-auto hide-scrollbar">
                <EditView
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />
              </div>
            </div>
          </div>

          {/* View Panel */}
          <div className="flex-1 max-w-[430px]">
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-[15px] font-semibold text-primary text-center">View</h2>
              </div>
              <div className="max-h-[calc(100vh-140px)] overflow-y-auto hide-scrollbar">
                <ViewContent />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile: Swipeable tabs layout
  return (
    <div className="mx-auto max-w-[430px] h-screen bg-[#f5f5f5] overflow-hidden">
      {/* Sticky Header */}
      <ProfileHeader
        activeTab={activeIndex === 0 ? "edit" : "view"}
        onTabChange={handleTabChange}
      />

      {/* Swipeable Content */}
      <div className="pt-[108px] h-full">
        <SwipeableViews
          activeIndex={activeIndex}
          onIndexChange={handleSwipe}
          scrollEnabled={!isDragging}
        >
          <EditView
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />
          <ViewContent />
        </SwipeableViews>
      </div>
    </div>
  );
}
