import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DropletIcon,
  HomeIcon,
  CalendarIcon,
  SettingsIcon,
  HelpCircleIcon,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className={cn("pb-12 h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            WaterFlow Analytics
          </h2>
          <div className="space-y-1">
            <Link href="/">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/events">
              <Button
                variant={
                  location.startsWith("/events") ? "secondary" : "ghost"
                }
                className="w-full justify-start"
              >
                <DropletIcon className="mr-2 h-4 w-4" />
                Water Events
              </Button>
            </Link>
            <Link href="/history">
              <Button
                variant={
                  location.startsWith("/history") ? "secondary" : "ghost"
                }
                className="w-full justify-start"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                History
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <div className="space-y-1">
            <Link href="/settings">
              <Button
                variant={
                  location.startsWith("/settings") ? "secondary" : "ghost"
                }
                className="w-full justify-start"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Preferences
              </Button>
            </Link>
            <Link href="/help">
              <Button
                variant={location.startsWith("/help") ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <HelpCircleIcon className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
