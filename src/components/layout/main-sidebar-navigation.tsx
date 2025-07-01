"use client";
import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Home, Users, FolderKanban, Settings, Server } from "lucide-react"; // Added Users2
import { useSelector } from "react-redux";
import { RootState } from "@/store"; // Adjust import path for your RootState

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  role?: string[]; // optional roles allowed to see this item
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: Home },
  { id: "cases", label: "Cases", href: "/cases", icon: FolderKanban },
  {
    id: "services",
    label: "Services",
    href: "/services",
    icon: Server,
    role: ["Admin", "User"],
  }, // Added Services
  { id: "users", label: "Users", href: "/users", icon: Users, role: ["Admin"] },
];

interface MainSidebarNavigationProps {
  isMobile?: boolean;
}

export default function MainSidebarNavigation({
  isMobile = false,
}: MainSidebarNavigationProps) {
  const permissions = useSelector(
    (state: RootState) => state.permissions.permissions
  );
  // console.log("is mobile open", isMobile);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Try to read userId directly
    let uId = localStorage.getItem("userId");
    let role = localStorage.getItem("userRole");

    // Fallback: extract from user object if not present
    if (!uId || !role) {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        try {
          const parsed = JSON.parse(userRaw);
          if (!uId) uId = parsed.userId;
          if (!role) role = parsed.role;
        } catch (e) {}
      }
    }

    setUserRole(role);
    setUserId(uId);
  }, []);

  // console.log("userId : ", userId);

  const canSeeUsers = () => {
    // Super Admin case (userId is 'admin')
    if (userId === "admin") return true;
    // All others: Only if permission granted
    if (
      permissions?.createUserRights ||
      permissions?.userRolesAndResponsibility
    )
      return true;
    return false;
  };

  // Filter nav items based on createUserRights permission

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === "users") return canSeeUsers();
    if (item.role && !item.role.includes(userRole || "")) return false;
    return true;
  });

  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  // Filter "Users" nav item for role 'User' (case-sensitive)

  const renderNavItem = (item: NavItem) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href));

    const linkContent = (
      <>
        <item.icon className="h-5 w-5" />
        <span
          className={cn(
            isMobile
              ? ""
              : "sr-only group-data-[state=expanded]:not-sr-only group-data-[state=expanded]:ml-2"
          )}
        >
          {item.label}
        </span>
      </>
    );

    if (isMobile) {
      return (
        <RouterLink
          key={item.id}
          to={item.href}
          className={cn(
            "flex items-center gap-4 px-2.5",
            isActive
              ? "text-sidebar-primary-foreground bg-sidebar-primary"
              : "text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent",
            "rounded-lg py-2"
          )}
        >
          {linkContent}
        </RouterLink>
      );
    }

    return (
      <TooltipProvider key={item.id} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <RouterLink
              to={item.href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                "group-data-[state=expanded]:w-full group-data-[state=expanded]:justify-start group-data-[state=expanded]:px-2.5 group-data-[state=expanded]:py-2",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent"
              )}
            >
              {linkContent}
            </RouterLink>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={5}
            className="group-data-[state=expanded]:hidden"
          >
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isMobile) {
    return <>{filteredNavItems.map(renderNavItem)}</>;
  }

  return (
    <nav className="grid gap-1 p-2 group-data-[state=expanded]:grid group-data-[state=expanded]:gap-2 group-data-[state=expanded]:p-4">
      {filteredNavItems.map(renderNavItem)}
    </nav>
  );
}
