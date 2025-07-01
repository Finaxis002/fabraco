"use client";

import React, { useEffect, useState } from "react";
import AddEditUserDialog from "./add-edit-user-dialog"; // Your add/edit dialog component
import { Link as RouterLink } from "react-router-dom";
import {
  Edit,
  Trash2,
  UserPlus,
  Settings2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/franchise";
import axiosInstance from "@/utils/axiosInstance";

interface User {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  email: string;
  role?: UserRole; // Changed from string to UserRole
  avatarUrl?: string;
  dataAIHint?: string;
  permissions?: any;
}

interface UserType {
  name: string;
  role?: string;
  userId?: string;
}

export default function UserList({ refreshKey }: { refreshKey?: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddEditUserDialogOpen, setIsAddEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<any>({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { toast } = useToast();

  // For permissions & user role (simplified: from localStorage, or you can fetch from backend)
  const userRole = localStorage.getItem("userRole") || "User";
  // Example permissions object — adjust according to your actual permissions model
  const fetchPermissions = async (userId: string) => {
    setPermissionsLoading(true);
    setPermissionsError(null);
    try {
      const response = await axiosInstance.get(`/users/${userId}`);
      const data = response.data;

      // Extract permissions from the user object:
      setPermissions(data.permissions || {}); // <-- important!
    } catch (err: any) {
      setPermissionsError(err.message || "Error fetching permissions");
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const userId = parsedUser._id || parsedUser.userId;

        setCurrentUser({
          name: parsedUser.name,
          role: parsedUser.role,
          userId,
        });

        if (parsedUser.name !== "Super Admin" && userId) {
          fetchPermissions(userId);
        }
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  // Backend base URL - adjust accordingly
  const BASE_URL = "https://tumbledrybe.sharda.co.in/api/users";

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/users");
      const data = response.data;
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  // Add or Edit User handler
  const handleSaveUser = async (
    userData: Partial<User>,
    isEditing: boolean
  ) => {
    try {
      const payload = {
        ...userData,
        permissions: userData.permissions || {}, // Make sure permissions are sent
      };

      if (isEditing && editingUser) {
        const userId = editingUser._id;
        const response = await axiosInstance.put(`users/${userId}`, payload);
        const data = response.data;

        // Check for role change and if updated user is current logged-in user
        if (data.roleChanged && data.updatedUser._id === currentUser?.userId) {
          toast({
            title: "Role Changed",
            description:
              "Your role has been changed. You will be logged out now.",
            variant: "destructive",
          });

          // Clear user session & redirect to login page
          localStorage.removeItem("user");
          localStorage.removeItem("userRole");
          // Any other session/token cleanup logic here

          // Redirect (using react-router-dom or window.location)
          window.location.href = "/login"; // or your login route
          return; // stop further processing
        }
      } else {
        const response = await axiosInstance.post("/users", payload); // if BASE_URL is set in axiosInstance
        // If your endpoint is `/users`, use axiosInstance.post("/users", payload);

        const data = response.data;
        // Show success toast on user creation

        toast({
          title: "User Added",
          description: `${userData.name} added successfully.`,
          variant: "default",
        });
      }
      // Close the dialog after successful save
      setIsAddEditUserDialogOpen(false);
      setEditingUser(null);

      // Optionally reload the user list
      fetchUsers();
    } catch (err) {
      // Error handling
    }
  };

  // Delete User handler
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await axiosInstance.delete(`users/${userId}`, {});
      toast({
        title: "User Deleted",
        description: `User with ID ${userId} deleted successfully.`,
        variant: "destructive",
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  // Password Reset handlers
  const handleResetPasswordClick = (user: User) => {
    setUserToReset(user);
    setShowResetDialog(true);
  };

  const confirmResetPassword = async () => {
    if (!userToReset) return;
    if (!resetPassword)
      return toast({ title: "Enter new password", variant: "destructive" });

    try {
      const response = await axiosInstance.put(
        `/users/${userToReset._id}/reset-password`,
        { newPassword: resetPassword }
      );
      const data = response.data;

      toast({
        title: "Password Reset",
        description: `${userToReset.name}'s password has been reset.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reset password.",
        variant: "destructive",
      });
    } finally {
      setShowResetDialog(false);
      setUserToReset(null);
      setResetPassword("");
    }
  };

  // Handlers to open dialogs
  const handleAddNewUser = () => {
    setEditingUser(null);
    setIsAddEditUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddEditUserDialogOpen(true);
  };

  useEffect(() => {
    console.log("Current User:", currentUser);
  }, [currentUser]);

  useEffect(() => {
    console.log("Permissions:", permissions);
  }, [permissions]);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>
            Manage all user accounts and their roles within the application.
          </CardDescription>
        </div>
        {(userRole === "Admin" || permissions?.createUserRights) && (
          <Button onClick={handleAddNewUser}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New User
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">Error: {error}</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    Avatar
                  </TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {(currentUser?.name === "Super Admin" ||
                    permissions?.userRolesAndResponsibility) && (
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="hidden sm:table-cell">
                      {user.avatarUrl ? (
                        <img
                          alt={`${user.name}'s avatar`}
                          className="aspect-square rounded-md object-cover h-10 w-10"
                          src={user.avatarUrl}
                          data-ai-hint={user.dataAIHint || "user avatar"}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{user.userId}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "Admin" ? "default" : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    {(currentUser?.name === "Super Admin" ||
                      permissions?.userRolesAndResponsibility) && (
                      <TableCell className="text-right flex justify-end gap-4 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:!bg-blue-600 hover:!text-white"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>

                        <RouterLink
                          to={`/users/${user._id}/permissions`}
                          className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium"
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          Manage
                        </RouterLink>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPasswordClick(user)}
                          className="text-yellow-600 hover:!bg-yellow-600 hover:!text-white"
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Reset Password
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:!bg-red-600 hover:!text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <CardFooter className="pt-6">
                <div className="text-center p-4 text-muted-foreground border border-dashed rounded-md w-full">
                  No users found. Click "Add New User" to create one.
                </div>
              </CardFooter>
            )}
          </>
        )}
      </CardContent>

      {isAddEditUserDialogOpen && (
        <AddEditUserDialog
          user={
            editingUser
              ? { ...editingUser, id: editingUser.id ?? editingUser._id ?? "" }
              : editingUser
          }
          isOpen={isAddEditUserDialogOpen}
          onClose={() => {
            setIsAddEditUserDialogOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {showResetDialog && (
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter a new password for <strong>{userToReset?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmResetPassword}
                disabled={!resetPassword}
              >
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <strong>{userToDelete?.name}</strong>? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!userToDelete) return;
                  try {
                    await axiosInstance.delete(`/users/${userToDelete._id}`);
                    toast({
                      title: "User Deleted",
                      description: `${userToDelete.name} deleted successfully.`,
                      variant: "default",
                    });
                    setShowDeleteDialog(false);
                    setUserToDelete(null);
                    fetchUsers();
                  } catch (err: any) {
                    toast({
                      title: "Error",
                      description:
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to delete user.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
function setCurrentUser(arg0: { name: any; role: any; userId: any }) {
  throw new Error("Function not implemented.");
}
