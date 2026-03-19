"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FlaskConical,
  History,
  Database,
  Code2,
  Settings,
  BookOpen,
  CreditCard,
  Atom,
} from "lucide-react"
import Link from "next/link"
import { SidebarNotification } from "@/components/sidebar-notification"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Researcher",
    email: "researcher@nanotoxi.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Core Platform",
      items: [
        {
          title: "Strategic Insights",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Nano-Toxicity Engine",
          url: "/toxicity-engine",
          icon: FlaskConical,
        },
        {
          title: "Research Archive",
          url: "/research-archive",
          icon: History,
        },
        {
          title: "Dataset Integrity",
          url: "/dataset-integrity",
          icon: Database,
        },
      ],
    },
    {
      label: "Developer Tools",
      items: [
        {
          title: "API & Lab Integration",
          url: "/api-integration",
          icon: Code2,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "Profile",
              url: "/settings/user",
            },
            {
              title: "Account",
              url: "/settings/account",
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
            },
          ],
        },
        {
          title: "My Subscription",
          url: "/settings/billing",
          icon: CreditCard,
        },
        {
          title: "Help & Documentation",
          url: "/faqs",
          icon: BookOpen,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Atom size={20} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">NanoToxi AI</span>
                  <span className="truncate text-xs">In-Silico Safety Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
