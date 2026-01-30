import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { addBalance } from "@/app/actions/db";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  console.log("body", body);
  console.log("signature", signature);

  if (!signature) {
    console.error("No Stripe signature found");
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.client_reference_id;
    const petals = session.metadata?.petals;

    if (!userId || !petals) {
      console.error("Missing userId or petals in session metadata", {
        userId,
        petals,
        metadata: session.metadata,
      });
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    const petalsAmount = parseInt(petals, 10);

    if (isNaN(petalsAmount) || petalsAmount <= 0) {
      console.error("Invalid petals amount:", petals);
      return NextResponse.json(
        { error: "Invalid petals amount" },
        { status: 400 }
      );
    }

    try {
      // Credit the user's balance
      const newBalance = await addBalance(userId, petalsAmount);

      if (newBalance === null) {
        console.error("Failed to add balance for user:", userId);
        return NextResponse.json(
          { error: "Failed to update user balance" },
          { status: 500 }
        );
      }

      console.log(
        `Successfully added ${petalsAmount} petals to user ${userId}. New balance: ${newBalance}`
      );
    } catch (error) {
      console.error("Error updating user balance:", error);
      return NextResponse.json(
        { error: "Failed to update user balance" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
