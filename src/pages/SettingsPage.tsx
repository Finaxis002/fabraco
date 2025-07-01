import PageHeader from "@/components/ui/page-header";
import SettingsLayout from "@/components/settings/settings-layout";
import GeneralSettings from "@/components/settings/general-settings";
import DataManagementSettings from "@/components/settings/data-management-settings";
import RoleManagementSettings from "@/components/settings/role-management-settings";
import type { SettingsSection } from "@/components/settings/settings-layout";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get current section from query, default to "general"
  const section = searchParams.keys().next().value || "general";

  const settingsSections: SettingsSection[] = [
    {
      value: "general",
      label: "General",
      icon: "SettingsIcon",
      content: <GeneralSettings />,
    },
    {
      value: "roles",
      label: "Roles & Permissions",
      icon: "UserCog",
      content: <RoleManagementSettings />,
    },
    {
      value: "data",
      label: "Data Management",
      icon: "Database",
      content: <DataManagementSettings />,
    },
  ];

  // Handler to change section and update URL
  const handleSectionChange = (newSection: string) => {
    setSearchParams({ [newSection]: "" });
  };

 
  return (
    <>
      <PageHeader
        title="Application Settings"
        description="Configure and customize FranchiseFlow to your needs."
      />
      <SettingsLayout
        sections={settingsSections}
        defaultSection={section}
        onSectionChange={handleSectionChange}
      />
    </>
  );
}
