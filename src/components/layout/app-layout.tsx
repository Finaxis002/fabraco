import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import MainHeader from "./main-header";
import MainSidebar from "./main-sidebar";
// Toaster is now rendered in src/main.tsx to be at the root of the BrowserRouter
import React from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-muted/40 dark:bg-background">
        <MainSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 print:sm:pl-0 group-data-[state=expanded]:sm:pl-60 transition-all duration-300 ease-in-out">
          {/* The sm:pl-14 and group-data-[state=expanded]:sm:pl-60 are for when sidebar is collapsed/expanded, adjust if needed */}
          <MainHeader />

          <main className="flex-1 p-6 sm:px-8 sm:py-4 md:gap-8 print:p-0">
            {children}
          </main>
        </div>
      </div>
      {/* Toaster moved to main.tsx */}
    </SidebarProvider>
  );
}
