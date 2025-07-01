"use client"; // This directive is not strictly necessary in Vite but doesn't harm.

import type { Case } from "@/types/franchise";
import { useSelector } from "react-redux";
import type { RootState } from "../../store"; // adjust path as per your project
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Share2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit, Link as LinkIcon, Eye, Trash } from "lucide-react";
import { Link as RouterLink } from "react-router-dom"; // Changed import
import { MOCK_USERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react"; // Import React
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { useAppDispatch } from "../../hooks/hooks"; // your typed useDispatch
import { fetchCurrentUser } from "../../features/userSlice";
import axiosInstance from "@/utils/axiosInstance";

const statusStyles: Record<string, string> = {
  "New-Case":
    "bg-blue-100 text-blue-800 hover:!bg-blue-200 hover:!text-blue-900",

  "In-Progress":
    "bg-yellow-100 text-yellow-800 hover:!bg-yellow-200 hover:!text-yellow-900",
  Completed:
    "bg-green-100 text-green-800 hover:!bg-green-200 hover:!text-green-900",
  Rejected: "bg-red-100 text-red-800 hover:!bg-red-200 hover:!text-red-900",
  Approved:
    "bg-purple-100 text-purple-800 hover:!bg-purple-200 hover:!text-purple-900",
};

interface CaseCardViewProps {
  cases: Case[]; // array of Case objects
  onDelete: (caseId: string) => void; // function called when delete happens
  unreadRemarks?: Record<string, number>; // caseId -> unread count
  unreadChats?: Record<string, number>; // caseId -> unread count
  allRemarks: {
    caseId: string;
    serviceId: string;
    userId: string;
    readBy: string[];
    _id: string;
  }[];
  currentUser: {
    id?: string;
    _id?: string;
    userId?: string;
  };
}

export default function CaseCardView({
  cases,
  onDelete,
  unreadRemarks,
  unreadChats,
  allRemarks,
  currentUser,
}: CaseCardViewProps) {
  const { toast } = useToast();
  const [displayCases, setDisplayCases] = useState<Case[]>(cases);
  const [lastUpdateDisplayCache, setLastUpdateDisplayCache] = useState<
    Record<string, string>
  >({});

  const [caseStatuses, setCaseStatuses] = useState<Record<string, string>>(
    () => {
      const initialStatuses: Record<string, string> = {};
      cases.forEach((c: Case) => {
        if (!c.id) return;
        initialStatuses[c.id] = c.status || c.status || "New-Case";
      });

      return initialStatuses;
    }
  );

  const permissions = useSelector(
    (state: RootState) => state.users.permissions
  );

  const userRole = localStorage.getItem("userRole");

  const isAdmin = userRole === "Admin" || userRole === "Super Admin";
  const currentUserId = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)._id
    : null;

  // console.log("currentUserId:", currentUserId);
  const navigate = useNavigate();
  const markChatsRead = async (caseId: string) => {
    if (!caseId || !currentUserId) return;
    const token = localStorage.getItem("token");

    try {
      await axiosInstance.put(`/chats/mark-read/${caseId}`, {
        userId: currentUserId,
      });

      console.log(
        `Marked chats as read for case ${caseId} by user ${currentUserId}`
      );
    } catch (error) {
      console.error("Error marking chats as read:", error);
    }
  };

  const handleViewClick = async (caseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    await markChatsRead(caseId);
    navigate(`/cases/${caseId}`);
  };

  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    const updatedStatuses: Record<string, string> = {};
    cases.forEach((c: Case) => {
      if (c.id) {
        updatedStatuses[c.id] = c.status || c.status || "";
      }
    });
    setCaseStatuses(updatedStatuses);
  }, [cases]);

  const allowedStatuses = ["New-Case", "In-Progress", "Completed", "Rejected"];

  const SUPER_ADMIN_ID = "68271c74487f3a8ea0dd6bdd";

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    // Check if userRole is "Viewer" - block change
    if (userRole === "Viewer") {
      toast({
        title: "Permission Denied",
        description: "You are a Viewer and can not change the case status.",
        variant: "destructive",
      });
      // Reset the select dropdown to current status (don't update UI)
      setCaseStatuses((prev) => ({
        ...prev,
        [caseId]:
          displayCases.find((c) => c.id === caseId)?.status || "New-Case",
      }));
      return; // Stop further processing
    }
    try {
      const currentCase = displayCases.find((c) => c.id === caseId);
      if (!currentCase) {
        toast({
          title: "Error",
          description: "Case not found.",
          variant: "destructive",
        });
        return;
      }

      // Prevent changing to "New-Case" if overallCompletionPercentage > 50
      if (
        newStatus === "New-Case" &&
        (currentCase.overallCompletionPercentage ?? 0) > 50
      ) {
        toast({
          title: "Invalid Status Change",
          description:
            "Can not change status to 'New-Case' when completion is above 50%.",
          variant: "destructive",
        });
        // Reset select value to current status
        setCaseStatuses((prev) => ({
          ...prev,
          [caseId]: currentCase.status || "",
        }));
        return;
      }

      setCaseStatuses((prev) => ({ ...prev, [caseId]: newStatus }));
      // console.log(`Updating status for case ${caseId} to ${newStatus}`);

      // Prepare payload
      const payload: any = { status: newStatus };

      if (newStatus === "In-Progress") {
        payload.overallStatus = "In-Progress";
      }

      const token = localStorage.getItem("token");

      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : {};

      // console.log("userobject", userObj);

      const response = await axiosInstance.put(`/cases/${caseId}`, payload);

      // console.log("API response:", response.data);

      setDisplayCases((prev: Case[]) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status: newStatus as Case["status"],
                // Update overallStatus only if newStatus is In-Progress
                overallStatus:
                  newStatus === "In-Progress" ? "In-Progress" : c.overallStatus,
              }
            : c
        )
      );

      // ========== NEW: Fetch case details to get assigned users and unit name ==========
      const caseRes = await axiosInstance.get(`/cases/${caseId}`);
      const { assignedUsers, unitName } = caseRes.data;

      // ========== NEW: Send notifications ==========
      for (const user of assignedUsers) {
        // Skip if you want to exclude the user who performed the change
        if (user.userId === userObj._id) continue;

        try {
          await axiosInstance.post("/pushnotifications/send-notification", {
            userId: user._id, // or user.userId, whichever is correct
            message: `Case "${unitName}" status updated to "${newStatus}" by ${userObj.name}.`,
            icon: "https://tumbledry.sharda.co.in/favicon.png",
          });
        } catch (notifyErr) {
          console.error(
            `Error sending notification to ${user._id}:`,
            notifyErr
          );
        }
      }

      // ========== Optionally: Notify Super Admin ==========
      try {
        await axiosInstance.post("/pushnotifications/send-notification", {
          userId: SUPER_ADMIN_ID,
          message: `Case "${unitName}" status updated to "${newStatus}" by ${userObj.name}.`,
          icon: "https://tumbledry.sharda.co.in/favicon.png",
        });
      } catch (superAdminErr) {
        console.error(
          "Error sending notification to Super Admin:",
          superAdminErr
        );
      }

      toast({
        title: "Status Updated",
        description: `Case status updated to "${newStatus}".`,
      });
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update case status. Please try again.",
        variant: "destructive",
      });

      setCaseStatuses((prev) => ({
        ...prev,
        [caseId]: cases.find((c: Case) => c.id === caseId)?.status || "",
      }));
    }
  };

  const sortedCases = [...cases].sort(
    (a, b) => Number(a.srNo) - Number(b.srNo)
  );

  useEffect(() => {
    // This effect is client-side only
    const newCache: Record<string, string> = {};
    cases.forEach((caseData) => {
      if (caseData.lastUpdate) {
        newCache[caseData.id ?? ""] = new Date(
          caseData.lastUpdate
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        newCache[caseData.id ?? ""] = "N/A";
      }
    });
    setLastUpdateDisplayCache(newCache);
  }, [cases]);

  const handleGenerateLink = (caseData: Case) => {
    const viewLink =
      caseData.viewLink ||
      `/client/cases/${caseData.id}?token=${Math.random()
        .toString(36)
        .substring(7)}`;
    // Ensure window and navigator are available (standard for client-side)
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}${viewLink}`);
      toast({
        title: "Link Generated & Copied!",
        description: "Viewer link copied to clipboard.",
      });
    } else {
      toast({
        title: "Clipboard Error",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (displayCases.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
            <p className="text-xl font-semibold text-muted-foreground">
              No cases found.
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or add a new case.
            </p>
            <Button asChild className="mt-4">
              <RouterLink to="/cases/new">
                {" "}
                {/* Changed Link */}
                Add New Case
              </RouterLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (JSON.stringify(cases) !== JSON.stringify(displayCases)) {
      setDisplayCases(cases);
    }
  }, [cases]);

  // console.log("current user", currentUser);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className=" w-[100px] sm:w-[80px]">SR No.</TableHead>
                <TableHead>Unit Name</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[180px]">Last Update</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right w-[250px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayCases.map((caseData: Case) => {
                const lastUpdateDisplay =
                  lastUpdateDisplayCache[caseData.id ?? ""] || "Loading...";

                const displayStatus =
                  caseStatuses[caseData.id ?? ""] ||
                  caseData.status ||
                  "New-Case";

                // const unreadRemarkCount =
                //   unreadRemarks?.[caseData.id ?? ""] || 0;
                const getUnreadRemarkCount = (caseData: Case): number => {
                  if (!currentUser || !caseData?.id) return 0;

                  const userId = currentUser._id || currentUser.userId;

                  // Collect all valid service IDs from the case
                  const existingServiceIds = new Set(
                    caseData.services?.map((s) => s.serviceId) ?? []
                  );

                  return allRemarks.filter(
                    (remark) =>
                      remark.caseId === caseData.id &&
                      typeof userId === "string" &&
                      !remark.readBy.includes(userId) && // not read by user
                      remark.userId !== userId && // not created by user
                      existingServiceIds.has(remark.serviceId) // service still exists
                  ).length;
                };

                const unreadRemarkCount =
                  unreadRemarks?.[caseData.id ?? ""] || 0;

                const unreadChatCount = unreadChats?.[caseData.id ?? ""] || 0;

                // console.log("unreadRemarkCount:", unreadRemarkCount);

                return (
                  <TableRow
                    key={caseData.id}
                    data-testid={`case-row-${caseData.id}`}
                  >
                    <TableCell className="font-medium flex items-center... gap-2">
                      {caseData.srNo}
                      {unreadRemarkCount > 0 && (
                        <span
                          className="bg-blue-600 w-4 h-4 flex items-center justify-center text-white text-xs px-1.5 rounded-full"
                          title="New Remark"
                        >
                          {unreadRemarkCount}
                        </span>
                      )}
                      {unreadChatCount > 0 && (
                        <span
                          className="bg-green-600 text-white text-xs px-1.5 rounded-full"
                          title="New Chat"
                        >
                          {unreadChatCount}
                        </span>
                      )}
                    </TableCell>

                    {/* <TableCell>{caseData.unitName}</TableCell> */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {caseData.unitName}
                      </div>
                    </TableCell>

                    <TableCell>{caseData.ownerName}</TableCell>
                    <TableCell>
                      <Select
                        value={displayStatus}
                        onValueChange={(value) =>
                          handleStatusChange(caseData.id ?? "", value)
                        }
                      >
                        <SelectTrigger
                          className={`w-[150px] rounded-md case-table ${
                            statusStyles[caseStatuses[caseData.id ?? ""]] || ""
                          }`}
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>

                        <SelectContent>
                          {allowedStatuses.map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className={`flex items-center rounded-md px-2 py-1 ${statusStyles[status]}`}
                            >
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>{lastUpdateDisplay}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {caseData.assignedUsers?.length ? (
                          caseData.assignedUsers.map((user, index) => {
                            const userName =
                              typeof user === "string"
                                ? user.trim()
                                : user?.name?.trim() || "Unknown";
                            const formattedName =
                              userName.length > 0
                                ? userName.charAt(0).toUpperCase() +
                                  userName.slice(1).toLowerCase()
                                : "Unknown";
                            return (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 whitespace-nowrap shadow-sm hover:bg-gray-200 transition cursor-default"
                                title={formattedName}
                              >
                                {formattedName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="italic text-gray-400">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{`${caseData.overallCompletionPercentage.toFixed(
                      2
                    )}%`}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex flex-wrap gap-2 justify-end">
                        {/* View */}
                        {permissions?.viewRights && (
                          <RouterLink
                            to={`/cases/${
                              ((caseData as any)._id ?? caseData.id) as string
                            }`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-xs transition"
                            onClick={(e) => handleViewClick(caseData.id!, e)}
                          >
                            <Eye className="h-4 w-4" />
                          </RouterLink>
                        )}

                        {/* Share */}
                        <button
                          onClick={() => handleGenerateLink(caseData)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-green-50 hover:bg-green-100 text-green-700 font-medium text-xs transition"
                          type="button"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        {permissions?.edit && (
                          <RouterLink
                            to={`/cases/${caseData.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium text-xs transition"
                          >
                            <Edit className="h-4 w-4" />
                          </RouterLink>
                        )}

                        {/* Delete */}
                        {permissions?.delete && (
                          <button
                            onClick={() => onDelete && onDelete(caseData.id!)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs transition"
                            type="button"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
