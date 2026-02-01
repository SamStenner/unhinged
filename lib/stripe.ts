import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// Petal package configuration
export const petalPackages = {
  starter: {
    id: "starter",
    petals: 50,
    priceInCents: 998,
    name: "Starter Pack",
    description: "50 petals for generating profile photos",
  },
  popular: {
    id: "popular",
    petals: 150,
    priceInCents: 1998,
    name: "Popular Pack",
    description: "150 petals for generating profile photos",
  },
  premium: {
    id: "premium",
    petals: 400,
    priceInCents: 3998,
    name: "Premium Pack",
    description: "400 petals for generating profile photos",
  },
} as const;

export type PackageId = keyof typeof petalPackages;
