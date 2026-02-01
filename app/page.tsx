"use client";

import Profile from "@/components/Profile";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Profile />
      <footer className="flex flex-col items-center justify-center pb-4 pt-20">
        <span className="text-2xl font-bold text-primary">Unhinged</span>
        <span className="text-muted-foreground font-medium text-xs mt-1">Generate photos for your dating profile</span>
        <div className="flex gap-2 items-center justify-center py-4">
          <Link className="text-muted-foreground hover:text-primary text-xs" href="/privacy">Privacy Policy</Link>
          <span className="text-muted-foreground text-xs">|</span>
          <Link className="text-muted-foreground hover:text-primary text-xs" href="/tos">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
