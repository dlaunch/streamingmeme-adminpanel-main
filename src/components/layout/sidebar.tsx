"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Archive,
  Star,
  History,
  Users,
  Settings,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Articles",
    href: "/articles",
    icon: FileText,
  },
  {
    title: "Top News",
    href: "/top-news",
    icon: Star,
  },
  {
    title: "Sponsors",
    href: "/sponsors",
    icon: Megaphone,
  },
  {
    title: "Admin History",
    href: "/admin-history",
    icon: History,
  },
  {
    title: "Archived",
    href: "/articles?classification=archived",
    icon: Archive,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center">
              {/* Light mode - show dark logo */}
              <Image
                src="/streamingmeme_logo_full_dark.svg"
                alt="StreamingMeme"
                width={180}
                height={40}
                className="dark:hidden"
                priority
              />
              {/* Dark mode - show light logo */}
              <Image
                src="/streamingmeme_logo_full_light.svg"
                alt="StreamingMeme"
                width={180}
                height={40}
                className="hidden dark:block"
                priority
              />
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              {/* Light mode - show dark icon */}
              <Image
                src="/streamingmeme_logo_icon_dark.svg"
                alt="StreamingMeme"
                width={32}
                height={32}
                className="dark:hidden"
                priority
              />
              {/* Dark mode - show light icon */}
              <Image
                src="/streamingmeme_logo_icon_light.svg"
                alt="StreamingMeme"
                width={32}
                height={32}
                className="hidden dark:block"
                priority
              />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
 
        {/* Collapse Button */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
