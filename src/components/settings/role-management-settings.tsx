"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fetchRoles, updateRole } from "@/services/rolesApi";
import { useToast } from "@/hooks/use-toast";

export default function RoleManagementSettings() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch((err) => {
        console.error("Failed to fetch roles", err);
        toast({
          title: "Error",
          description: "Unable to load roles from backend",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePermissionChange = (
    roleId: string,
    key: string,
    checked: boolean
  ) => {
    setRoles((prev) =>
      prev.map((role) =>
        role._id === roleId
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [key]: checked,
              },
            }
          : role
      )
    );
  };

  const handleSave = async (role: any) => {
    try {
      await updateRole(role._id, { permissions: role.permissions });
      toast({
        title: "Success",
        description: `Permissions for "${role.name}" updated.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  if (loading) return <p>Loading roles...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>
          Define roles and their permissions within the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {roles.map((role) => (
            <AccordionItem value={role._id} key={role._id}>
              <AccordionTrigger className="text-base font-medium">
                {role.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                  <h4 className="text-sm font-semibold mb-2">
                    Permissions for {role.name}:
                  </h4>
                  {Object.keys(role.permissions).map((key) => (
                    <div
                      key={key}
                      className="flex items-center space-x-2 gap-4"
                    >
                      <Checkbox
                        id={`${role._id}-${key}`}
                        checked={role.permissions[key]}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(role._id, key, !!checked)
                        }
                      />
                      <Label
                        htmlFor={`${role._id}-${key}`}
                        className="capitalize text-sm"
                      >
                        {key.replace(/([A-Z])/g, " $1")}
                      </Label>
                    </div>
                  ))}
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={() => handleSave(role)}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
