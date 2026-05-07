"use client";

import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
// import { useRealtimeArticles } from "@/hooks/use-realtime-articles";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const { user } = useAuth();
  // const { isConnected, recentChanges } = useRealtimeArticles();

  // Get initials from displayName, fallback to email
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.firstName) {
      const first = user.firstName[0] || "";
      const last = user.lastName?.[0] || "";
      return (first + last).toUpperCase() || "U";
    }
    if (user?.email) {
      return user.email
        .split("@")[0]
        .split(".")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const initials = getInitials();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Admin Panel</h1>
        {/* Wifi badge - commented out for now
        {isConnected ? (
          <Badge variant="outline" className="text-emerald-600 border-emerald-600/60 dark:text-emerald-400 dark:border-emerald-500/50">
            <Wifi className="h-3 w-3 mr-1" />
            Live
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}
        */}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications - commented out for now
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {recentChanges.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  {recentChanges.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Recent Updates</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentChanges.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No recent updates
              </div>
            ) : (
              recentChanges.slice(0, 5).map((change, i) => (
                <DropdownMenuItem key={i} className="flex flex-col items-start py-2">
                  <span className="font-medium">{change.type} Article</span>
                  <span className="text-xs text-muted-foreground truncate max-w-full">
                    {change.article?.title || "Unknown article"}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        */}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {user?.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName || user.email || "User"} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || user?.firstName || "Account"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Profile - commented out for now
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            */}
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
