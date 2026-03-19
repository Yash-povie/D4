"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Atom } from "lucide-react"
import { cn } from '@/lib/utils'

export interface PricingPlan {
  id: string
  name: string
  audience: string
  description: string
  price: string
  frequency: string
  features: string[]
  popular?: boolean
  current?: boolean
  isCustom?: boolean
}

interface PricingPlansProps {
  plans?: PricingPlan[]
  mode?: 'pricing' | 'billing'
  currentPlanId?: string
  onPlanSelect?: (planId: string) => void
}

const defaultPlans: PricingPlan[] = [
  {
    id: 'individual',
    name: 'Individual',
    audience: 'For Individual Researchers & Labs',
    description: 'Full access to NanoToxi AI — all modules, unlimited predictions, and API access.',
    price: '$100',
    frequency: '/month',
    features: [
      'Unlimited nanoparticle simulations',
      'Full 3-Stage Ensemble Pipeline',
      'Batch Excel predictions',
      'Research Archive (full history)',
      'API access (1,000 calls/day)',
      'RAG-powered AI explanations',
      'Dataset Integrity dashboard',
      'Priority support',
    ],
    popular: true,
  },
]

export function PricingPlans({
  plans = defaultPlans,
  mode = 'pricing',
  currentPlanId,
  onPlanSelect
}: PricingPlansProps) {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const handleCheckout = async (plan: PricingPlan) => {
    if (onPlanSelect) {
      onPlanSelect(plan.id)
      return
    }
    setLoadingPlanId(plan.id)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoadingPlanId(null)
    }
  }

  const getButtonText = (plan: PricingPlan) => {
    if (mode === 'billing' && currentPlanId === plan.id) {
      return 'Current Plan'
    }
    return 'Subscribe — $100/mo'
  }

  const isButtonDisabled = (plan: PricingPlan) => {
    return mode === 'billing' && currentPlanId === plan.id
  }

  return (
    <div className='grid gap-8 max-w-md mx-auto'>
      {plans.map(tier => (
        <Card
          key={tier.id}
          className={cn('flex flex-col pt-0 border-white/10 bg-[#0f1428]/80 backdrop-blur-sm', {
            'border-[#00c6ff]/40 relative shadow-lg shadow-[#00c6ff]/5': tier.popular,
            'border-[#00c6ff]/40': currentPlanId === tier.id && mode === 'billing'
          })}
          aria-labelledby={`${tier.id}-title`}
        >
          {tier.popular && (
            <div className='absolute start-0 -top-3 w-full'>
              <Badge className='mx-auto flex w-fit gap-1.5 rounded-full font-medium'>
                <Atom className='!size-4' />
                {mode === 'billing' && currentPlanId === tier.id ? (
                  <span>Current Plan</span>
                ) : (
                  <span>NanoToxi Individual</span>
                )}
              </Badge>
            </div>
          )}
          <CardHeader className='space-y-2 pt-8 text-center'>
            <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wider'>{tier.audience}</p>
            <CardTitle id={`${tier.id}-title`} className='text-2xl'>
              {tier.name}
            </CardTitle>
            <p className='text-muted-foreground text-sm text-balance'>{tier.description}</p>
          </CardHeader>
          <CardContent className='flex flex-1 flex-col space-y-6'>
            <div className='flex items-baseline justify-center'>
              <span className='text-4xl font-bold'>{tier.price}</span>
              <span className='text-muted-foreground text-sm'>{tier.frequency}</span>
            </div>
            <div className='space-y-2'>
              {tier.features.map(feature => (
                <div key={feature} className='flex items-center gap-2'>
                  <div className='bg-[#00c6ff]/10 text-[#00c6ff] rounded-full p-1'>
                    <Check className='size-3.5' />
                  </div>
                  <span className='text-sm'>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className='w-full cursor-pointer'
              size='lg'
              variant={isButtonDisabled(tier) ? 'outline' : 'default'}
              disabled={isButtonDisabled(tier) || loadingPlanId === tier.id}
              onClick={() => handleCheckout(tier)}
              aria-label={`${getButtonText(tier)} - ${tier.name} plan`}
            >
              {loadingPlanId === tier.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                getButtonText(tier)
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
