"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole } from "@/types/franchise";
import { Eye, EyeOff } from "lucide-react";
import { fetchRoles } from "@/services/rolesApi";

const userFormSchema = z.object({
  userId: z.string().min(2, "User ID is required."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.string().min(1, "User role is required."),

  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface AddEditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    user: Omit<User, "id" | "avatarUrl" | "dataAIHint"> & { id?: string },
    isEditing: boolean
  ) => void;
  user?: User | null;
}

export default function AddEditUserDialog({
  isOpen,
  onClose,
  onSave,
  user,
}: AddEditUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [allRoles, setAllRoles] = useState<any[]>([]);

  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: roles[0] || "", // Default to the first role or an empty string
      password: "",
    },
  });

  useEffect(() => {
    fetchRoles()
      .then((data) => {
        setAllRoles(data); // store full role objects
        setRoles(data.map((role: any) => role.name)); // for dropdown
        setRolesLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch roles:", err);
        setRoles(["User"]);
        setAllRoles([]);
        setRolesLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!rolesLoaded) return; // ⛔ Don't reset if roles not loaded

    if (user) {
      form.reset({
        userId: user.userId || "",
        name: user.name,
        email: user.email,
        role: user.role || roles[0] || "",
      });
    } else {
      form.reset({
        userId: "",
        name: "",
        email: "",
        role: roles[0] || "",
      });
    }
  }, [user, form, isOpen, rolesLoaded]); // ✅ added rolesLoaded as dependency

  function onSubmit(data: UserFormValues) {
    const matchedRole = allRoles.find((r) => r.name === data.role);
    const rolePermissions = matchedRole?.permissions || {};

    onSave(
      {
        ...data,
        role: data.role as UserRole,
        permissions: rolePermissions,
      },
      isEditing
    );
  }

  // console.log("roles", roles);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modal={true}
    >
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[480px] p-4 sm:p-6 modal no-search">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this user."
              : "Fill in the details to create a new user account."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., user001 or john_doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g., john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a secure password"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground focus:outline-none"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {rolesLoaded && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((roleName) => (
                          <SelectItem key={roleName} value={roleName}>
                            {roleName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Adding..."
                  : isEditing
                  ? "Save Changes"
                  : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
