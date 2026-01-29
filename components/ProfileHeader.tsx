"use client";

import { GiftIcon, SettingsIcon } from "lucide-react";

interface ProfileHeaderProps {
  activeTab: "edit" | "view";
  onTabChange: (tab: "edit" | "view") => void;
}

export default function ProfileHeader({
  activeTab,
  onTabChange,
}: ProfileHeaderProps) {
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white w-full max-w-[430px]">
      {/* Top row - Cancel / Name / Done */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          className="font-medium text-base"
        >
          <GiftIcon className="size-5" />
        </button>
        <h1 className="text-xl font-semibold text-primary">Unhinged</h1>
        <button
          type="button"
        >
          <SettingsIcon className="size-5" />
        </button>
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
