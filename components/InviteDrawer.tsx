"use client";

import { useState } from "react";
import { useIsMobile } from "@/lib/is-mobile";
import { GiftIcon, Share2Icon, CopyIcon, CheckIcon, SparklesIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function InviteContent() {
  const [copied, setCopied] = useState(false);
  const inviteCode = "UNHINGED-ABC123";
  const shareUrl = "https://unhinged.app/invite/ABC123";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Unhinged!",
          text: `Use my invite code ${inviteCode} to join Unhinged and we'll both earn 20 petals!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.error("Share failed:", err);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col items-center px-6 pb-8 pt-2">
      {/* Decorative flower/petal icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#67295F]/10 to-[#67295F]/20 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#67295F] to-[#8B3D7F] flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-7 h-7 text-white" />
          </div>
        </div>
        {/* Floating petals decoration */}
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F5B5D0] opacity-60" />
        <div className="absolute -bottom-1 -left-2 w-3 h-3 rounded-full bg-[#E8A0C0] opacity-50" />
        <div className="absolute top-2 -left-3 w-2 h-2 rounded-full bg-[#D890B0] opacity-40" />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-semibold text-gray-900 mb-2 text-center font-serif">
        Share the love
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-center text-[15px] leading-relaxed mb-6 max-w-[280px]">
        Invite your friends to Unhinged and you'll both earn{" "}
        <span className="font-semibold text-[#67295F]">20 petals</span> when they join.
      </p>

      {/* Reward highlight card */}
      <div className="w-full bg-gradient-to-r from-[#67295F]/5 via-[#67295F]/10 to-[#67295F]/5 rounded-2xl p-4 mb-6 border border-[#67295F]/10">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F5B5D0] to-[#E890B0] flex items-center justify-center">
              <span className="text-sm">🌸</span>
            </div>
            <span className="text-xl font-bold text-[#67295F]">+20</span>
          </div>
          <span className="text-gray-400">for each friend</span>
        </div>
      </div>

      {/* Invite code */}
      <div className="w-full mb-4">
        <label className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-2 block text-center">
          Your invite code
        </label>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex-1 text-center">
            <span className="font-mono text-lg font-semibold text-gray-800 tracking-wide">
              {inviteCode}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Copy invite code"
          >
            {copied ? (
              <CheckIcon className="w-5 h-5 text-green-500" />
            ) : (
              <CopyIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Share button */}
      <Button
        onClick={handleShare}
        className="w-full h-12 bg-[#67295F] hover:bg-[#5a2352] text-white font-semibold text-[15px] rounded-full shadow-lg shadow-[#67295F]/20 transition-all hover:shadow-xl hover:shadow-[#67295F]/30"
      >
        <Share2Icon className="w-5 h-5 mr-2" />
        Share with friends
      </Button>

      {/* Terms note */}
      <p className="text-xs text-gray-400 text-center mt-4 max-w-[260px]">
        Petals are earned when your friend creates an account and completes their profile.
      </p>
    </div>
  );
}

interface InviteDrawerProps {
  children: React.ReactNode;
}

export default function InviteDrawer({ children }: InviteDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="bg-white">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Invite Friends</DrawerTitle>
            <DrawerDescription>
              Share your invite code to earn petals
            </DrawerDescription>
          </DrawerHeader>
          <InviteContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[400px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            Share your invite code to earn petals
          </DialogDescription>
        </DialogHeader>
        <InviteContent />
      </DialogContent>
    </Dialog>
  );
}
