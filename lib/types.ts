export interface Photo {
  id: string;
  src: string;
  alt: string;
  slot: number; // 0-5, represents fixed position in grid
}

export interface Prompt {
  id: string;
  prompt: string;
  answer: string;
  order: number;
}

export interface Profile {
  name?: string;
  age?: number;
  gender?: string;
  height?: string;
  location?: string;
}

export interface ProfileData {
  profile: Profile;
  photos: Photo[];
  prompts: Prompt[];
}
