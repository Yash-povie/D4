"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeCustomizer, ThemeCustomizerTrigger } from "@/components/theme-customizer";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";
import { TrialBanner } from "@/components/trial-banner";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const [bannerDismissed, setBannerDismissed] = React.useState(false);
  const { config } = useSidebarConfig();
  const { user, isExpired, hasStripeSubscription, loading } = useAuth();

  // Show trial banner when: loaded, not loading, not a paying subscriber, trial not yet expired (still active)
  // OR when expired (trial ended, no subscription)
  const showTrialBanner =
    !loading &&
    !bannerDismissed &&
    !hasStripeSubscription &&
    !!user?.trialExpiry;

  const renderContent = (sidebarSide: "left" | "right") => {
    const sidebar = (
      <AppSidebar
        variant={config.variant}
        collapsible={config.collapsible}
        side={config.side}
      />
    );

    const main = (
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          {showTrialBanner && (
            <div className="pt-3">
              <TrialBanner
                trialExpiry={user?.trialExpiry ?? null}
                onDismiss={() => setBannerDismissed(true)}
              />
            </div>
          )}
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
        <SiteFooter />
      </SidebarInset>
    );

    return sidebarSide === "left" ? (
      <>{sidebar}{main}</>
    ) : (
      <>{main}{sidebar}</>
    );
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {renderContent(config.side === "left" ? "left" : "right")}

      <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />
      <UpgradeToProButton />
    </SidebarProvider>
  );
}
