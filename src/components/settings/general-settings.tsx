// src/pages/settings/GeneralSettings.tsx or wherever it's located

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppName } from "@/contenxt/AppNameContext";

export default function GeneralSettings() {
  const { appName, setAppName } = useAppName();
  const [localAppName, setLocalAppName] = useState(appName);
  const [saving, setSaving] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or default to false
    return localStorage.getItem("theme") === "dark";
  });

  // Sync input field with latest app name from context
  useEffect(() => {
    setLocalAppName(appName);
  }, [appName]);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleSave = async () => {
    setSaving(true);
    await setAppName(localAppName);
    document.title = `Settings | ${localAppName}`;
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Manage general application settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="appName">Application Name</Label>
          <Input
            id="appName"
            value={localAppName}
            onChange={(e) => setLocalAppName(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="emailNotifications" className="font-medium">
              Email Notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable or disable email notifications for case updates.
            </p>
          </div>
          <Switch id="emailNotifications" defaultChecked />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="darkMode" className="font-medium">
              Dark Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Toggle dark mode for the application.
            </p>
          </div>
          <Switch
            id="darkMode"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
