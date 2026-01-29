"use client";

import { useProfile } from "@/lib/profile-context";
import Profile from "@/components/Profile";
import Onboarding from "@/components/Onboarding";

export default function Home() {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useProfile();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Profile />
      <Onboarding
        open={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    </div>
  );
}
