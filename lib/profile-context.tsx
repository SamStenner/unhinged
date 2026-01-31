"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Profile, Photo, Prompt, ProfileData } from "./types";
import { defaultProfileData } from "./mock-data";
import { useAuth } from "./auth-context";
import {
  getOrCreateUser,
  getUserProfile,
  updateUserProfile,
  setPhotoSlot,
  removePhotoFromSlot,
  swapPhotoSlots as dbSwapPhotoSlots,
  addPrompt as dbAddPrompt,
  updatePrompt as dbUpdatePrompt,
  removePrompt as dbRemovePrompt,
  deductBalance as dbDeductBalance,
  addBalance as dbAddBalance,
} from "@/app/actions/db";

const USER_PROFILE_KEY = "unhinged_user_profile";

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

export interface PreviewPhoto {
  id: string;
  dataUrl: string;
  slot: number;
}

export interface PendingGenerationParams {
  images: File[];
  count: number;
  prompt: string;
}

interface ProfileContextType {
  profile: Profile;
  photos: Photo[];
  prompts: Prompt[];
  balance: number;
  isLoading: boolean;

  // Uploaded images (session-only, for AI generation)
  uploadedImages: UploadedImage[];
  addUploadedImage: (file: File) => void;
  removeUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;

  // Preview photos (session-only, for unauthenticated users)
  previewPhotos: PreviewPhoto[];
  setPreviewPhotos: (photos: PreviewPhoto[]) => void;
  clearPreviewPhotos: () => void;

  // Pending generation params (for replay after signup)
  pendingGenerationParams: PendingGenerationParams | null;
  setPendingGenerationParams: (params: PendingGenerationParams | null) => void;

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

  // Balance actions
  deductBalance: (amount: number) => Promise<boolean>;
  addBalance: (amount: number) => Promise<void>;

  // Refresh from database - returns the number of photos loaded
  refreshFromDatabase: () => Promise<{ photosCount: number }>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<ProfileData>(defaultProfileData);
  const [balance, setBalance] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [previewPhotos, setPreviewPhotosState] = useState<PreviewPhoto[]>([]);
  const [pendingGenerationParams, setPendingGenerationParamsState] = useState<PendingGenerationParams | null>(null);
  const prevUserRef = useRef<typeof user>(undefined);

  // Load profile from database or localStorage
  const loadProfile = useCallback(async (): Promise<{ photosCount: number }> => {
    if (user) {
      // User is authenticated - load from database
      setIsLoading(true);
      try {
        // Ensure user exists in database
        await getOrCreateUser(user.id);

        // Fetch full profile
        const dbProfile = await getUserProfile(user.id);

        if (dbProfile) {
          const loadedPhotos = dbProfile.photos.map((p) => ({
            id: p.id,
            src: p.url,
            alt: "Profile photo",
            slot: p.slot,
          }));
          setData({
            profile: {
              name: dbProfile.user.name ?? undefined,
              age: dbProfile.user.age ?? undefined,
              gender: dbProfile.user.gender ?? undefined,
              height: dbProfile.user.height ?? undefined,
              location: dbProfile.user.location ?? undefined,
            },
            photos: loadedPhotos,
            prompts: dbProfile.prompts,
          });
          setBalance(dbProfile.user.balance);
          return { photosCount: loadedPhotos.length };
        }
        return { photosCount: 0 };
      } catch (error) {
        console.error("Error loading profile from database:", error);
        return { photosCount: 0 };
      } finally {
        setIsLoading(false);
      }
    } else {
      // Not authenticated - load from localStorage
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
      setIsLoading(false);
      return { photosCount: 0 };
    }
  }, [user]);

  // Uploaded images actions
  const addUploadedImage = useCallback((file: File) => {
    const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const preview = URL.createObjectURL(file);
    setUploadedImages((prev) => [...prev, { id, file, preview }]);
  }, []);

  const removeUploadedImage = useCallback((id: string) => {
    setUploadedImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const clearUploadedImagesFn = useCallback(() => {
    setUploadedImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
  }, []);

  // Preview photos actions
  const setPreviewPhotos = useCallback((photos: PreviewPhoto[]) => {
    setPreviewPhotosState(photos);
  }, []);

  const clearPreviewPhotos = useCallback(() => {
    setPreviewPhotosState([]);
  }, []);

  // Pending generation params actions
  const setPendingGenerationParams = useCallback((params: PendingGenerationParams | null) => {
    setPendingGenerationParamsState(params);
  }, []);

  // Detect sign out and reset state
  useEffect(() => {
    // If user was previously signed in and is now signed out
    if (prevUserRef.current && !user) {
      // Reset all local state
      setData(defaultProfileData);
      setBalance(0);

      // Clear uploaded images
      clearUploadedImagesFn();

      // Clear preview photos and pending params
      clearPreviewPhotos();
      setPendingGenerationParams(null);

      // Clear localStorage
      localStorage.removeItem(USER_PROFILE_KEY);
      localStorage.removeItem("showPrompts");
    }

    // Update ref to current user
    prevUserRef.current = user;
  }, [user, clearUploadedImagesFn, clearPreviewPhotos, setPendingGenerationParams]);

  // Initial load - wait for auth to finish before loading profile
  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for auth to finish
    }
    loadProfile().then(() => setIsHydrated(true));
  }, [loadProfile, isAuthLoading]);

  // Refresh from database
  const refreshFromDatabase = useCallback(async (): Promise<{ photosCount: number }> => {
    return await loadProfile();
  }, [loadProfile]);

  // Profile actions
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      setData((prev) => {
        const newProfile = { ...prev.profile, ...updates };
        // Persist to localStorage (for unauthenticated users)
        if (!user) {
          localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
        }
        return {
          ...prev,
          profile: newProfile,
        };
      });

      // If authenticated, also save to database
      if (user) {
        // Only include fields that are actually being updated
        const dbUpdates: {
          name?: string | null;
          age?: number | null;
          gender?: string | null;
          height?: string | null;
          location?: string | null;
        } = {};
        
        if ('name' in updates) dbUpdates.name = updates.name ?? null;
        if ('age' in updates) dbUpdates.age = updates.age ?? null;
        if ('gender' in updates) dbUpdates.gender = updates.gender ?? null;
        if ('height' in updates) dbUpdates.height = updates.height ?? null;
        if ('location' in updates) dbUpdates.location = updates.location ?? null;
        
        await updateUserProfile(user.id, dbUpdates);
      }
    },
    [user]
  );

  // Photo actions
  const addPhotoToSlot = useCallback(
    async (slot: number, photo: Omit<Photo, "id" | "slot">) => {
      const newPhotoId = `photo-${Date.now()}`;

      setData((prev) => {
        const filteredPhotos = prev.photos.filter((p) => p.slot !== slot);
        return {
          ...prev,
          photos: [
            ...filteredPhotos,
            {
              ...photo,
              id: newPhotoId,
              slot,
            },
          ],
        };
      });

      // For database photos, we need the actual photo ID from the generated_photos table
      // This is handled separately when photos are generated
    },
    []
  );

  const addPhotosToSlots = useCallback(
    async (photosToAdd: { slot: number; photo: Omit<Photo, "id" | "slot"> }[]) => {
      setData((prev) => {
        const slotsToFill = photosToAdd.map((p) => p.slot);
        const filteredPhotos = prev.photos.filter(
          (p) => !slotsToFill.includes(p.slot)
        );
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

  const removePhoto = useCallback(
    async (id: string) => {
      const photoToRemove = data.photos.find((p) => p.id === id);

      setData((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== id),
      }));

      // If authenticated, remove from database slot
      if (user && photoToRemove) {
        await removePhotoFromSlot(user.id, photoToRemove.slot);
      }
    },
    [user, data.photos]
  );

  const swapPhotoSlots = useCallback(
    async (slotA: number, slotB: number) => {
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

      // If authenticated, swap in database
      if (user) {
        await dbSwapPhotoSlots(user.id, slotA, slotB);
      }
    },
    [user]
  );

  const getPhotoBySlot = useCallback(
    (slot: number) => {
      return data.photos.find((p) => p.slot === slot);
    },
    [data.photos]
  );

  // Prompt actions
  const addPrompt = useCallback(
    async (prompt: Omit<Prompt, "id" | "order">) => {
      if (data.prompts.length >= 3) return;

      const localId = `prompt-${Date.now()}`;
      const localOrder = data.prompts.length;

      setData((prev) => {
        if (prev.prompts.length >= 3) return prev;
        return {
          ...prev,
          prompts: [
            ...prev.prompts,
            {
              ...prompt,
              id: localId,
              order: localOrder,
            },
          ],
        };
      });

      // If authenticated, add to database
      if (user) {
        const dbPrompt = await dbAddPrompt(user.id, prompt.prompt, prompt.answer);
        if (dbPrompt) {
          // Update local state with database ID
          setData((prev) => ({
            ...prev,
            prompts: prev.prompts.map((p) =>
              p.id === localId ? { ...p, id: dbPrompt.id } : p
            ),
          }));
        }
      }
    },
    [user, data.prompts.length]
  );

  const removePrompt = useCallback(
    async (id: string) => {
      setData((prev) => ({
        ...prev,
        prompts: prev.prompts
          .filter((p) => p.id !== id)
          .map((p, index) => ({ ...p, order: index })),
      }));

      // If authenticated, remove from database
      if (user) {
        await dbRemovePrompt(user.id, id);
      }
    },
    [user]
  );

  const updatePromptFn = useCallback(
    async (id: string, updates: Partial<Prompt>) => {
      setData((prev) => ({
        ...prev,
        prompts: prev.prompts.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));

      // If authenticated, update in database
      if (user) {
        await dbUpdatePrompt(user.id, id, {
          prompt: updates.prompt,
          answer: updates.answer,
        });
      }
    },
    [user]
  );

  // Balance actions
  const deductBalance = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!user) {
        // For unauthenticated users, just check local balance
        if (balance < amount) return false;
        setBalance((prev) => prev - amount);
        return true;
      }

      const result = await dbDeductBalance(user.id, amount);
      if (result.success) {
        setBalance(result.newBalance);
      }
      return result.success;
    },
    [user, balance]
  );

  const addBalanceFn = useCallback(
    async (amount: number): Promise<void> => {
      if (!user) {
        setBalance((prev) => prev + amount);
        return;
      }

      const newBalance = await dbAddBalance(user.id, amount);
      if (newBalance !== null) {
        setBalance(newBalance);
      }
    },
    [user]
  );

  return (
    <ProfileContext.Provider
      value={{
        profile: data.profile,
        photos: data.photos,
        prompts: data.prompts.sort((a, b) => a.order - b.order),
        balance,
        isLoading,
        uploadedImages,
        addUploadedImage,
        removeUploadedImage,
        clearUploadedImages: clearUploadedImagesFn,
        previewPhotos,
        setPreviewPhotos,
        clearPreviewPhotos,
        pendingGenerationParams,
        setPendingGenerationParams,
        updateProfile,
        addPhotoToSlot,
        addPhotosToSlots,
        removePhoto,
        swapPhotoSlots,
        getPhotoBySlot,
        addPrompt,
        removePrompt,
        updatePrompt: updatePromptFn,
        deductBalance,
        addBalance: addBalanceFn,
        refreshFromDatabase,
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
