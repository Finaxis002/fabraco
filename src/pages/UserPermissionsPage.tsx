import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  DEFAULT_USER_PERMISSIONS,
} from "@/lib/constants";
import type { User, UserRole } from "@/types/franchise";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShieldCheck, UserCircle, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import axiosInstance from "@/utils/axiosInstance";

type PermissionsState = typeof DEFAULT_USER_PERMISSIONS;

const permissionLabels: Record<string, string> = {
  allCaseAccess: "All Case Access",
  viewRights: "View",
  createCaseRights: "Create Case",
  createUserRights: "Create User",
  userRolesAndResponsibility: "User Roles and Responsibility",
  delete: "Delete",
  edit: "Edit",
  remarks: "Remarks",       // ✅ separated
  chat: "Chat",             // ✅ separated
};


export default function UserPermissionsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<User | undefined | null>(null); // null for loading
  const [permissions, setPermissions] = useState<PermissionsState>(
    DEFAULT_USER_PERMISSIONS
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance(
          `/users/${userId}/permissions`
        ); 
        const data = res.data;
        setUser(data);
        setPermissions(data.permissions);
      } catch (err) {
        console.error(err);
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handlePermissionChange = (
    permissionKey: keyof PermissionsState,
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionKey]: checked,
    }));
  };

 const handleSaveChanges = async () => {
  if (!user || !user._id) return;
  try {
    const res = await axiosInstance.put(
      `/users/${user._id}/permissions`,
      { permissions } // wrap in an object
    );
    toast({
      title: "Permissions Updated",
      description: `Permissions for ${user.name} have been saved.`,
      variant: "default",
    });
    navigate("/users");
  } catch (err) {
    toast({
      title: "Error",
      description: "Failed to update permissions.",
      variant: "destructive",
    });
  }
};


  if (loading || user === null) {
    return (
      <>
        <PageHeader
          title="Loading User Permissions..."
          description="Fetching user details and current permissions."
        >
          <Button variant="outline" asChild onClick={() => navigate(-1)}>
            <RouterLink to="/users">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </RouterLink>
          </Button>
        </PageHeader>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
            <div className="flex justify-end mt-6">
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageHeader
          title="User Not Found"
          description={`Could not find user with ID: ${userId}`}
        >
          <Button variant="outline" asChild onClick={() => navigate(-1)}>
            <RouterLink to="/users">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </RouterLink>
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="pt-6 text-center">
            <p>
              The user you are trying to manage permissions for does not exist.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Manage Permissions for ${user.name}`}
        description={`Role: ${user.role} | Email: ${user.email}`}
      >
        <Button variant="outline" asChild onClick={() => navigate(-1)}>
          <RouterLink to="/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </RouterLink>
        </Button>
      </PageHeader>

     <Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
      Available Permissions
    </CardTitle>
    <CardDescription>
      Select the permissions this user should have. Permissions are often
      based on roles but can be customized.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
      // 1 column on very small, 2 on small screens, 3 on medium and above
    >
      {Object.entries(permissions).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
        >
          <Checkbox
            id={key}
            checked={value}
            onCheckedChange={(checked) =>
              handlePermissionChange(
                key as keyof PermissionsState,
                !!checked
              )
            }
          />
          <Label
            htmlFor={key}
            className="text-sm font-medium cursor-pointer flex-1"
          >
            {permissionLabels[key] || key}
          </Label>
        </div>
      ))}
    </div>

    <div className="flex justify-end pt-4">
      <Button onClick={handleSaveChanges}>
        <Save className="mr-2 h-4 w-4" />
        Save Changes
      </Button>
    </div>
  </CardContent>
</Card>

    </>
  );
}
