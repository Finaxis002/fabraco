import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Edit,
  Settings2,
  ShieldCheck,
  Trash2,
  EyeOff,
  Eye,
  Plus,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { UserRole } from "@/types/franchise";
import AddEditUserDialog from "./add-edit-user-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; // If you use a toast/snackbar
import axiosInstance from "@/utils/axiosInstance";

interface User {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
  dataAIHint?: string;
  permissions?: any;
}

interface UserCardViewProps {
  refreshKey?: any;
}

interface UserType {
  name: string;
  role?: string;
  userId?: string;
}

const BASE_URL = "https://tumbledrybe.sharda.co.in/api/users";

const UserCardView: React.FC<UserCardViewProps> = ({ refreshKey }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // You can add your permission logic here if needed

  const [permissions, setPermissions] = useState<any>({});
  const [isAddEditUserDialogOpen, setIsAddEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  const userRole = localStorage.getItem("userRole") || "User";
  const { toast } = useToast();

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
    // eslint-disable-next-line
  }, [refreshKey]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsAddEditUserDialogOpen(true);
  };

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

  // Dummy handlers for edit, delete, reset password
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddEditUserDialogOpen(true);
  };
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowResetDialog(true);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u._id === userId) || null;
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmResetPassword = async () => {
    // Implement your reset password API call here
    setShowResetDialog(false);
    if (selectedUser) {
      // Example: await api.resetPassword(selectedUser._id);
      toast({
        title: "Password reset",
        description: `Password reset for ${selectedUser.name}`,
      });
    }
    setSelectedUser(null);
  };

  const confirmDeleteUser = async () => {
    // Implement your delete user API call here
    setShowDeleteDialog(false);
    if (selectedUser) {
      // Example: await api.deleteUser(selectedUser._id);
      setUsers(users.filter((u) => u._id !== selectedUser._id));
      toast({
        title: "User deleted",
        description: `${selectedUser.name} has been deleted.`,
      });
    }
    setSelectedUser(null);
  };
  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">Loading...</div>
    );
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }
  if (!users.length) {
    return (
      <div className="text-center p-6 text-muted-foreground border border-dashed rounded-md w-full">
        No users found. Click "Add New User" to create one.
      </div>
    );
  }

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
        const response = await axiosInstance.put(`/users/${userId}`, payload);
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
        const response = await axiosInstance.post("/users", payload);
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

  return (
    <>
      {(userRole === "Admin" || permissions?.userRolesAndResponsibility) && (
        <div className="flex justify-end mb-4">
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={handleAddUser}
          >
            <Plus className="h-4 w-4" />
            <span>Add New User</span>
          </Button>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ">
        {users.map((user) => (
          <Card key={user._id} className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-4">
              {user.avatarUrl ? (
                <img
                  alt={`${user.name}'s avatar`}
                  className="aspect-square rounded-md object-cover h-12 w-12"
                  src={user.avatarUrl}
                  data-ai-hint={user.dataAIHint || "user avatar"}
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle className="text-base">{user.name}</CardTitle>
                <CardDescription className="text-xs">
                  {user.email}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-2">
                <span className="font-semibold">User ID:</span> {user.userId}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Role:</span>{" "}
                <Badge
                  variant={user.role === "Admin" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              </div>
            </CardContent>

            {(currentUser?.name === "Super Admin" ||
              permissions?.userRolesAndResponsibility) && (
              <CardFooter className="flex flex-wrap gap-2 justify-end p-3 sm:p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="text-blue-600 hover:!bg-blue-600 hover:!text-white flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <RouterLink
                  to={`/users/${user._id}/permissions`}
                  className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium"
                >
                  <Settings2 className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Manage</span>
                </RouterLink>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPassword(user)}
                  className="text-yellow-600 hover:!bg-yellow-600 hover:!text-white flex items-center"
                >
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Reset</span>
                  <span className="hidden sm:inline"> Password</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user._id)}
                  className="text-red-600 hover:!bg-red-600 hover:!text-white flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Delete</span>
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
        {isAddEditUserDialogOpen && (
          <AddEditUserDialog
            user={
              editingUser
                ? {
                    ...editingUser,
                    id: editingUser.id ?? editingUser._id ?? "",
                  }
                : undefined // undefined for add new user
            }
            isOpen={isAddEditUserDialogOpen}
            onClose={() => {
              setIsAddEditUserDialogOpen(false);
              setEditingUser(null);
            }}
            onSave={handleSaveUser}
          />
        )}

        {isAddEditUserDialogOpen && editingUser && (
          <AddEditUserDialog
            user={
              editingUser
                ? {
                    ...editingUser,
                    id: editingUser.id ?? editingUser._id ?? "",
                  }
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

        {/* Reset Password Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="max-w-[90vw] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter a new password for <strong>{selectedUser?.name}</strong>.
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

        {/* Delete User Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-[90vw] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <b>{selectedUser?.name}</b>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteUser}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default UserCardView;
