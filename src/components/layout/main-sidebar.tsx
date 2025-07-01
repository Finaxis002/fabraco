"use client";
import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import MainSidebarNavigation from "./main-sidebar-navigation";
import { APP_NAME } from "@/lib/constants";

export default function MainSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  // Close sidebar on route change (optional, if you want)
  // useEffect(() => {
  //   setIsMobileOpen(false);
  // }, [location.pathname]);

  return (
    <>
     
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 sm:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed h-[100vh] inset-y-0 left-0 z-30 flex flex-col border-r bg-gradient-to-b from-sidebar to-sidebar/90 text-sidebar-foreground print:hidden transition-all duration-300 ease-in-out will-change-transform
          ${isExpanded ? "w-64" : "w-16"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0 sm:z-10
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // Close on mobile swipe/esc can be added here if needed
      >
        {/* Header with logo and expand/collapse button */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border/50 p-4">
          <RouterLink
            to="/"
            className="flex items-center gap-2 font-semibold text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            {/* <Building2 className="h-6 w-6 shrink-0" /> */}
            <img
              src="/favicon.png"
              alt="FCA Logo"
              className="h-8 w-8 shrink-0 rounded !bg-transparent object-contain"
              style={{ background: "white" }} // Optional: white background for contrast
            />
            {isExpanded && (
              <span className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                {APP_NAME}
              </span>
            )}
          </RouterLink>

         
          {/* Close button for mobile */}
          <button
            className="sm:hidden p-1 rounded-full hover:bg-sidebar-accent transition-colors z-50 pointer-events-auto relative"
            aria-label="Close sidebar"
            onClick={() => setIsMobileOpen(false)}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <MainSidebarNavigation />
        </div>

        {/* Footer with Settings */}
        {isAdmin && (
          <div className="border-t border-sidebar-border/50 p-2">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <RouterLink
                    to="/settings"
                    className={`flex items-center rounded-lg text-sidebar-foreground transition-colors hover:text-sidebar-primary-foreground hover:bg-sidebar-accent ${
                      isExpanded || isMobileOpen
                        ? "w-full justify-start px-3 py-2 gap-2"
                        : "h-9 w-9 justify-center"
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    {(isExpanded || isMobileOpen) && <span>Settings</span>}
                  </RouterLink>
                </TooltipTrigger>
                {!isExpanded && !isMobileOpen && (
                  <TooltipContent side="right" sideOffset={10}>
                    Settings
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {/* Hover indicator for collapsed state (desktop only) */}
        {!isExpanded && isHovered && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-2 h-16 bg-primary rounded-r-full opacity-50 hidden sm:block"></div>
        )}
      </aside>
    </>
  );
}
