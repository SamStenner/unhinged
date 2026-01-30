"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Profile, Photo, Prompt, ProfileData } from "./types";
import { defaultProfileData } from "./mock-data";

const USER_PROFILE_KEY = "unhinged_user_profile";

interface ProfileContextType {
  profile: Profile;
  photos: Photo[];
  prompts: Prompt[];

  // Profile actions
  updateProfile: (updates: Partial<Profile>) => void;

  // Photo actions
  addPhotoToSlot: (slot: number, photo: Omit<Photo, "id" | "slot">) => void;
  addPhotosToSlots: (photosToAdd: { slot: number; photo: Omit<Photo, "id" | "slot"> }[]) => void;
  removePhoto: (id: string) => void;
  swapPhotoSlots: (slotA: number, slotB: number) => void;
  getPhotoBySlot: (slot: number) => Photo | undefined;

  // Prompt actions
  addPrompt: (prompt: Omit<Prompt, "id" | "order">) => void;
  removePrompt: (id: string) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProfileData>(defaultProfileData);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check localStorage on mount for saved profile
  useEffect(() => {
    const savedProfile = localStorage.getItem(USER_PROFILE_KEY);

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setData((prev) => ({
          ...prev,
          profile: { ...prev.profile, ...parsed },
        }));
      } catch (e) {
        console.error("Error parsing saved profile:", e);
      }
    }

    setIsHydrated(true);
  }, []);

  // Profile actions
  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setData((prev) => {
      const newProfile = { ...prev.profile, ...updates };
      // Persist to localStorage
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
      return {
        ...prev,
        profile: newProfile,
      };
    });
  }, []);

  // Photo actions
  const addPhotoToSlot = useCallback(
    (slot: number, photo: Omit<Photo, "id" | "slot">) => {
      setData((prev) => {
        // Remove any existing photo in this slot
        const filteredPhotos = prev.photos.filter((p) => p.slot !== slot);
        return {
          ...prev,
          photos: [
            ...filteredPhotos,
            {
              ...photo,
              id: `photo-${Date.now()}`,
              slot,
            },
          ],
        };
      });
    },
    []
  );

  const addPhotosToSlots = useCallback(
    (photosToAdd: { slot: number; photo: Omit<Photo, "id" | "slot"> }[]) => {
      setData((prev) => {
        // Get slots that will be filled
        const slotsToFill = photosToAdd.map((p) => p.slot);
        // Remove any existing photos in those slots
        const filteredPhotos = prev.photos.filter(
          (p) => !slotsToFill.includes(p.slot)
        );
        // Create new photos with unique IDs
        const newPhotos = photosToAdd.map((item, index) => ({
          ...item.photo,
          id: `photo-${Date.now()}-${index}`,
          slot: item.slot,
        }));
        return {
          ...prev,
          photos: [...filteredPhotos, ...newPhotos],
        };
      });
    },
    []
  );

  const removePhoto = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }));
  }, []);

  const swapPhotoSlots = useCallback((slotA: number, slotB: number) => {
    setData((prev) => {
      const photoA = prev.photos.find((p) => p.slot === slotA);
      const photoB = prev.photos.find((p) => p.slot === slotB);

      return {
        ...prev,
        photos: prev.photos.map((p) => {
          if (p.id === photoA?.id) return { ...p, slot: slotB };
          if (p.id === photoB?.id) return { ...p, slot: slotA };
          return p;
        }),
      };
    });
  }, []);

  const getPhotoBySlot = useCallback(
    (slot: number) => {
      return data.photos.find((p) => p.slot === slot);
    },
    [data.photos]
  );

  // Prompt actions
  const addPrompt = useCallback((prompt: Omit<Prompt, "id" | "order">) => {
    setData((prev) => {
      if (prev.prompts.length >= 3) return prev; // Max 3 prompts
      return {
        ...prev,
        prompts: [
          ...prev.prompts,
          {
            ...prompt,
            id: `prompt-${Date.now()}`,
            order: prev.prompts.length,
          },
        ],
      };
    });
  }, []);

  const removePrompt = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      prompts: prev.prompts
        .filter((p) => p.id !== id)
        .map((p, index) => ({ ...p, order: index })),
    }));
  }, []);

  const updatePrompt = useCallback((id: string, updates: Partial<Prompt>) => {
    setData((prev) => ({
      ...prev,
      prompts: prev.prompts.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <ProfileContext.Provider
      value={{
        profile: data.profile,
        photos: data.photos,
        prompts: data.prompts.sort((a, b) => a.order - b.order),
        updateProfile,
        addPhotoToSlot,
        addPhotosToSlots,
        removePhoto,
        swapPhotoSlots,
        getPhotoBySlot,
        addPrompt,
        removePrompt,
        updatePrompt,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
