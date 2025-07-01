"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserCircle,
  Shield,
  Bell,
  CheckCircle2,
  XCircle,
  Check,
  Download,
  PlusCircle,
  Edit,
  Trash,
  BarChart,
  ClipboardList,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import AccessPermissions from "@/components/AccessPermissions";
import ResetPasswordModal from "@/components/adminpassowrdreset/ResetPasswordModal";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();

  // Load user from localStorage (parse JSON or null)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser?.avatarUrl || null
  );

  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    document.title = `My Profile | ${APP_NAME}`;
  }, []);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    },
  });

  const userRole = localStorage.getItem("userRole");
  const userString = localStorage.getItem("user");

  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        name: currentUser.name || "",
        email: currentUser.email || "",
      });
      setAvatarPreview(currentUser.avatarUrl || null);
    }
  }, [currentUser, profileForm]);

  if (!currentUser) {
    return <PageHeader title="Profile" description="User data not found." />;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}

        <div className="flex flex-col lg:flex-row gap-8 ">
          {/* Left Sidebar - Profile Summary */}
          <div className="w-full lg:w-1/3 space-y-6 flex flex-col items-center justify-center">
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage
                      src={avatarPreview || undefined}
                      alt={currentUser.name}
                    />
                    <AvatarFallback className="text-4xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      {currentUser.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5 border-4 border-white">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
                {userRole === "user" && (
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentUser.userId || "N/A"}
                  </h2>
                )}

                <h2 className="text-xl font-bold text-gray-900">
                  {currentUser.name || "N/A"}
                </h2>
                {userRole === "user" && (
                  <p className="text-gray-600">{currentUser.email || "N/A"}</p>
                )}
              </div>
            </div>

            {userRole === "Admin" && (
              <>
                <Button onClick={() => setShowResetModal(true)}>
                  <Lock className="mr-2" /> Reset Password
                </Button>
                {showResetModal && (
                  <ResetPasswordModal
                    adminId={currentUser.adminId}
                    onClose={() => setShowResetModal(false)}
                  />
                )}
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Permissions Section */}
            <AccessPermissions currentUser={currentUser} />
          </div>
        </div>
      </div>
    </>
  );
}
