"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DashboardNavLinks } from "@/components/dashboard-nav-links";

export function MobileDashboardNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(100vw-1rem,20rem)] max-w-[20rem] flex-col gap-0 p-0 sm:max-w-[20rem]"
      >
        <SheetHeader className="space-y-0 border-b px-4 py-4 text-left">
          <SheetTitle asChild className="text-base font-semibold">
            <Link
              href="/dashboard"
              className="inline-flex rounded-md text-base font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setOpen(false)}
            >
              DM Dashboard
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation for the dashboard. Choose a section to open it.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4 scrollbar-thin">
          <DashboardNavLinks
            isAdmin={isAdmin}
            collapsed={false}
            onLinkClick={() => setOpen(false)}
            className="px-0"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
