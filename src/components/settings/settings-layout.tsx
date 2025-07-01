"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";
import {
  UserCog,
  Database,
  Settings as SettingsIconLucide,
} from "lucide-react"; // Renamed Settings to avoid conflict

// Define a mapping for icon strings to components
const iconMap: { [key: string]: React.ElementType } = {
  SettingsIcon: SettingsIconLucide,
  UserCog: UserCog,
  Database: Database,
  // Add other icons here as needed
};

export interface SettingsSection {
  // Exported for use in SettingsPage
  value: string;
  label: string;
  icon: string; // Changed from React.ElementType to string
  content: ReactNode;
}

export type SettingsLayoutProps = {
  sections: SettingsSection[];
  defaultSection: string;
  onSectionChange?: (newSection: string) => void;
};

export default function SettingsLayout({
  sections,
  defaultSection,
  onSectionChange,
}: SettingsLayoutProps) {
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  // Filter sections for non-admin users: only show 'data' tab
  const visibleSections = isAdmin
    ? sections
    : sections.filter((section) => section.value === "data");

  return (
    <Tabs
      value={defaultSection}
      onValueChange={(val) => {
        if (onSectionChange) onSectionChange(val);
      }}
      className="w-full"
    >
      <TabsList className="flex w-full overflow-x-auto gap-2 mb-6 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent md:grid md:grid-cols-3 lg:grid-cols-5">
        {visibleSections.map((section) => {
          const IconComponent = iconMap[section.icon] || SettingsIconLucide;
          return (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 whitespace-nowrap"
            >
              <IconComponent className="h-4 w-4" />
              {section.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {visibleSections.map((section) => (
        <TabsContent key={section.value} value={section.value}>
          {section.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
