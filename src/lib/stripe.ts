import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

export const PRICE_IDS = {
  individual: process.env.NEXT_PUBLIC_STRIPE_INDIVIDUAL_PRICE_ID!,
} as const

export type PlanId = keyof typeof PRICE_IDS
