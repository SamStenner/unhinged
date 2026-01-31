"use server";

import { stripe, petalPackages, type PackageId } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

export async function createCheckoutSession(
  packageId: PackageId
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Get the current user from Supabase
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { url: null, error: "You must be logged in to purchase petals" };
    }

    // Get the selected package
    const pkg = petalPackages[packageId];
    if (!pkg) {
      return { url: null, error: "Invalid package selected" };
    }

    // Get the origin for redirect URLs
    const headersList = await headers();
    const origin = headersList.get("origin") ?? "http://localhost:3000";

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pkg.name,
              description: pkg.description,
            },
            unit_amount: pkg.priceInCents,
          },
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        petals: pkg.petals.toString(),
      },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return { url: session.url, error: null };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { url: null, error: "Failed to create checkout session" };
  }
}
