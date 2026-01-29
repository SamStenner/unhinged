import type { ProfileData } from "./types";

// Available prompt options for adding new prompts
export const availablePrompts = [
  "My most irrational fear",
  "A shower thought I had recently",
  "My simple pleasures",
  "The way to win me over is",
  "I'm looking for",
  "My greatest strength",
  "I geek out on",
  "Typical Sunday",
  "I'm convinced that",
  "Green flags I look for",
  "My love language is",
  "Dating me is like",
];

// Default empty profile - user fills in during onboarding
export const defaultProfileData: ProfileData = {
  profile: {
    
  },
  photos: [],
  prompts: [],
};
