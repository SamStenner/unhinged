"use client";

import { GiftIcon, UserIcon } from "lucide-react";
import InviteDrawer from "./InviteDrawer";
import SettingsDrawer from "./SettingsDrawer";
import { useProfile } from "@/lib/profile-context";
import { useAuth } from "@/lib/auth-context";

interface ProfileHeaderProps {
  activeTab: "edit" | "view";
  onTabChange: (tab: "edit" | "view") => void;
}

export default function ProfileHeader({
  activeTab,
  onTabChange,
}: ProfileHeaderProps) {
  const { balance } = useProfile();
  const { user, openAuthModal } = useAuth();

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white w-full max-w-[430px]">
      {/* Top row - Cancel / Name / Done */}
      <div className="relative flex items-center justify-between px-4 pt-3 pb-2">
        {user ? (
          <InviteDrawer>
            <button
              type="button"
              className="font-medium text-base hover:opacity-70 transition-opacity"
            >
              <GiftIcon className="size-5" />
            </button>
          </InviteDrawer>
        ) : (
          <div className="size-5" />
        )}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-primary">Unhinged</h1>
        {user ? (
          <SettingsDrawer>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#67295F]/10 to-[#67295F]/5 hover:from-[#67295F]/15 hover:to-[#67295F]/10 rounded-full transition-all"
            >
              <span className="text-sm">🌸</span>
              <span className="text-sm font-semibold text-[#67295F]">{balance}</span>
            </button>
          </SettingsDrawer>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <UserIcon className="size-5 text-[#67295F]" />
          </button>
        )}
      </div>

      {/* Tab row */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => onTabChange("edit")}
          className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${activeTab === "edit"
            ? "text-primary border-b-2 border-[#67295F]"
            : "text-gray-400"
            }`}
        >
          Edit
        </button>
        <div className="flex items-center justify-center px-2">
          <span className="text-gray-300 text-lg">/</span>
        </div>
        <button
          type="button"
          onClick={() => onTabChange("view")}
          className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${activeTab === "view"
            ? "text-primary border-b-2 border-[#67295F]"
            : "text-gray-400"
            }`}
        >
          View
        </button>
      </div>
    </div>
  );
}
