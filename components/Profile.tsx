"use client";

import { useState } from "react";
import { GiftIcon, UserIcon } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/lib/is-mobile";
import SwipeableViews from "./SwipeableViews";
import EditView from "./EditView";
import ViewContent from "./ViewContent";
import InviteDrawer from "./InviteDrawer";
import SettingsDrawer from "./SettingsDrawer";

export default function Profile() {
  const { balance } = useProfile();
  const { user, openAuthModal } = useAuth();
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0); // 0 = Edit, 1 = View
  const activeTab = activeIndex === 0 ? "edit" : "view";
  const setActiveTab = (tab: "edit" | "view") => setActiveIndex(tab === "edit" ? 0 : 1);

  const giftEnabled = false

  // Desktop: Side-by-side layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-muted">
        {/* Desktop Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-[900px] mx-auto relative flex items-center justify-between px-6 py-3">
            {giftEnabled && user ? (
              <InviteDrawer>
                <button type="button" className="hover:opacity-70 transition-opacity">
                  <GiftIcon className="size-5" />
                </button>
              </InviteDrawer>
            ) : (
              <div className="size-5" />
            )}
            <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-primary">Unhinged</h1>
            {user ? (
              <SettingsDrawer>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#67295F]/10 hover:bg-[#67295F]/15 rounded-full transition-all">
                  <span className="text-sm">🌸</span>
                  <span className="text-sm font-semibold text-[#67295F]">{balance}</span>
                </button>
              </SettingsDrawer>
            ) : (
              <button type="button" onClick={() => openAuthModal()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <UserIcon className="size-5" />
              </button>
            )}
          </div>
        </header>

        {/* Side-by-side panels */}
        <div className="max-w-[900px] mx-auto flex gap-6 p-6">
          <div className="flex-1 max-w-[430px]">
            <div className="bg-white rounded-xl border border-border">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-[15px] font-semibold text-primary text-center">Edit</h2>
              </div>
              <EditView />
            </div>
          </div>
          <div className="flex-1 max-w-[430px]">
            <div className="bg-white rounded-xl border border-border">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-[15px] font-semibold text-primary text-center">View</h2>
              </div>
              <ViewContent />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile: Simple tabs with normal page scroll
  return (
    <div className="max-w-[430px] mx-auto bg-[#f5f5f5]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white">
        {/* Top row */}
        <div className="relative flex items-center justify-between px-4 pt-3 pb-2">
          {giftEnabled && user ? (
            <InviteDrawer>
              <button type="button" className="hover:opacity-70 transition-opacity">
                <GiftIcon className="size-5" />
              </button>
            </InviteDrawer>
          ) : (
            <div className="size-5" />
          )}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-primary">Unhinged</h1>
          {user ? (
            <SettingsDrawer>
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#67295F]/10 hover:bg-[#67295F]/15 rounded-full transition-all">
                <span className="text-sm">🌸</span>
                <span className="text-sm font-semibold text-[#67295F]">{balance}</span>
              </button>
            </SettingsDrawer>
          ) : (
            <button type="button" onClick={() => openAuthModal()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <UserIcon className="size-5" />
            </button>
          )}
        </div>

        {/* Tab row */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${activeTab === "edit" ? "text-primary border-b-2 border-[#67295F]" : "text-gray-400"
              }`}
          >
            Edit
          </button>
          <div className="flex items-center justify-center px-2">
            <span className="text-gray-300 text-lg">/</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("view")}
            className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${activeTab === "view" ? "text-primary border-b-2 border-[#67295F]" : "text-gray-400"
              }`}
          >
            View
          </button>
        </div>
      </header>

      {/* Swipeable content */}
      <SwipeableViews activeIndex={activeIndex} onIndexChange={setActiveIndex}>
        <EditView />
        <ViewContent />
      </SwipeableViews>
    </div>
  );
}
