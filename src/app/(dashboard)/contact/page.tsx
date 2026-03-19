"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mail, Building2, Shield, Loader2, CheckCircle2 } from "lucide-react"

export default function ContactSalesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    // TODO: Connect to your backend/email service to handle form submission
    // For now, simulate a submission
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center px-4 py-20 lg:px-6">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <CheckCircle2 className="mx-auto size-12 text-green-500" />
            <h2 className="text-2xl font-bold">Thank you!</h2>
            <p className="text-muted-foreground text-balance">
              Our sales team will review your request and get back to you within 1-2 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Contact Sales</h1>
          <p className="text-muted-foreground mt-2">
            Get a custom quote tailored to your organization's needs.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Plan highlights */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  <CardTitle className="text-base">Institutions / Companies</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Unlimited Seats</p>
                <p>Access to all modules</p>
                <p>Admin Dashboard</p>
                <p>Priority GPU access</p>
                <p>Priority Support</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  <CardTitle className="text-base">Regulatory Bodies</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Everything from previous tiers</p>
                <p>Supports Larger Libraries</p>
                <p>Customise Models</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact form */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Tell us about your needs</CardTitle>
              <CardDescription>
                Fill out the form below and our team will reach out with a custom quote.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" placeholder="john@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Organization name</Label>
                  <Input id="company" placeholder="Acme Inc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan of interest</Label>
                  <Select required>
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="institution">Institutions / Companies</SelectItem>
                      <SelectItem value="regulatory">Regulatory Bodies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Tell us more about your requirements</Label>
                  <Textarea
                    id="message"
                    placeholder="Number of users, specific modules needed, compliance requirements..."
                    rows={4}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4 mr-2" />
                      Request Custom Quote
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
