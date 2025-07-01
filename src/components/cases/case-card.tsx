import type { Case } from "@/types/franchise";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Link as LinkIcon,
  Eye,
  CalendarDays,
  User,
  Users,
  Trash,
  PercentSquare,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store"; // adjust path as per your project structure
import { useAppDispatch } from "../../hooks/hooks"; // your typed useDispatch
import { fetchCurrentUser } from "../../features/userSlice";
import { useState, useEffect } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";

interface CaseCardViewProps {
  cases: Case[]; // array of Case objects
  onDelete: (caseId: string) => void; // function called when delete happens
  unreadRemarks?: Record<string, number>; // caseId -> unread count
  unreadChats?: Record<string, number>; // caseId -> unread count
}

interface CaseCardProps {
  caseData: Case;
  onDelete?: (caseId: string) => void;
  unreadRemarks?: Record<string, number>;
  unreadChats?: Record<string, number>;
  isActive?: boolean;
}

const statusStyles: Record<string, string> = {
  "New-Case": "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
  "In-Progress":
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900",
  Completed:
    "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
  Rejected: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900",
  Approved:
    "bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900",
};

const allowedStatuses = ["New-Case", "In-Progress", "Completed", "Rejected"];

export default function CaseCard({
  caseData,
  onDelete,
  unreadRemarks,
  unreadChats,
  isActive,
}: CaseCardProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(
    caseData.status || "New-Case"
  );
  const [updating, setUpdating] = useState(false);

  const { toast } = useToast();
  const [lastUpdateDisplay, setLastUpdateDisplay] =
    useState<string>("Loading...");

  const dispatch = useAppDispatch();

  const userRole = localStorage.getItem("userRole");

  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  const navigate = useNavigate();

  // Extract current user ID from localStorage
  const currentUserStr = localStorage.getItem("user");
  const currentUserId = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)._id
    : null;

  const markChatsRead = async () => {
    if (!caseData.id || !currentUserId) return;
    const token = localStorage.getItem("token");
    try {
      await axiosInstance.put(
        `/chats/mark-read/${caseData.id}`,
        { userId: currentUserId } // Send the ObjectId here
      );
      console.log(`Marked chats as read for case ${caseData.id}`);
    } catch (error) {
      console.error("Error marking chats read:", error);
    }
  };

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  const permissions = useSelector(
    (state: RootState) => (state.users as any).permissions
  );

  useEffect(() => {
    if (caseData.lastUpdate) {
      setLastUpdateDisplay(
        new Date(caseData.lastUpdate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    } else {
      setLastUpdateDisplay("N/A");
    }
  }, [caseData.lastUpdate]);

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

  const SUPER_ADMIN_ID = "68271c74487f3a8ea0dd6bdd";

  const handleStatusChange = async (newStatus: string) => {
    // Prevent invalid change (optional)
    if (
      newStatus === "New-Case" &&
      (caseData.overallCompletionPercentage ?? 0) > 50
    ) {
      toast({
        title: "Invalid Status Change",
        description:
          "Cannot change status to 'New-Case' when completion is above 50%.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStatus(newStatus);
    setUpdating(true);

    try {
      const payload: any = { status: newStatus };
      if (newStatus === "In-Progress") payload.overallStatus = "In-Progress";

      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : {};

      await axiosInstance.put(`/cases/${caseData.id}`, payload);

      const caseRes = await axiosInstance.get(`/cases/${caseData.id}`);
      const { assignedUsers, unitName } = caseRes.data;

      // Send notification to all assigned users except the actor
      for (const user of assignedUsers) {
        if (user.userId === userObj._id) continue; // adjust field as needed
        try {
          await axiosInstance.post("/pushnotifications/send-notification", {
            userId: user._id,
            message: `Case "${unitName}" status updated to "${newStatus}" by ${userObj.name}.`,
            icon: "https://tumbledry.sharda.co.in/favicon.png",
          });
        } catch (err) {
          console.error(`Error sending notification to user ${user._id}:`, err);
        }
      }

      // Notify Super Admin
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
      toast({
        title: "Update Failed",
        description: "Failed to update case status. Please try again.",
        variant: "destructive",
      });
      setCurrentStatus(caseData.status || "New-Case");
    } finally {
      setUpdating(false);
    }
  };

  const handleViewClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await markChatsRead();
    navigate(`/cases/${caseData.id}`);
  };

  const unreadRemarkCount = unreadRemarks?.[caseData.id ?? ""] || 0;
  const unreadChatCount = unreadChats?.[caseData.id ?? ""] || 0;

  // useEffect(() => {
  //   console.log("Case ID:", caseData.id);
  //   console.log("Unread Remark Count:", unreadRemarkCount);
  //   console.log("Unread Chat Count:", unreadChatCount);
  // }, [unreadRemarkCount, unreadChatCount, caseData.id]);

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors flex items-center gap-2">
            <RouterLink
              to={`/cases/${caseData.id}`}
              className="hover:underline"
            >
              {caseData.unitName}
            </RouterLink>
            {unreadRemarkCount > 0 && (
              <span
                className="bg-blue-600 text-white text-xs px-1.5 rounded-full"
                title="New Remark"
              >
                {unreadRemarkCount}
              </span>
            )}
            {!isActive &&
              unreadChatCount > 0 && ( // Only show if not active
                <span
                  className="bg-green-600 text-white text-xs px-1.5 rounded-full"
                  title="New Chat"
                >
                  💬 {unreadChatCount}
                </span>
              )}
          </CardTitle>

          {permissions?.edit ? (
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger
                className={`w-[150px] rounded-md ${
                  statusStyles[currentStatus] || ""
                }`}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className={`flex items-center rounded-md px-2 py-1 ${
                      statusStyles[status] || ""
                    }`}
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div
              className={`inline-block px-3 py-1 rounded-md text-center ${
                statusStyles[currentStatus] || ""
              }`}
            >
              {currentStatus}
            </div>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          SRN: {caseData.srNo}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 shrink-0" />
          <span>{caseData.ownerName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span>Last Update: {lastUpdateDisplay}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <PercentSquare className="h-4 w-4 shrink-0" />
          <span>
            Progress: {`${caseData.overallCompletionPercentage.toFixed(2)}%`}
          </span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <Users className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-2 text-sm">
            {caseData.assignedUsers?.length ? (
              (caseData.assignedUsers as (string | { name?: string })[]).map(
                (user, index) => {
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
                      className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 whitespace-nowrap shadow-sm hover:bg-blue-200 transition cursor-default"
                      title={formattedName}
                    >
                      {formattedName}
                    </span>
                  );
                }
              )
            ) : (
              <span className="italic text-gray-400">N/A</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex w-full justify-end gap-2">
          {/* View button - usually everyone can view */}
          <Button
            variant="outline"
            size="sm"
            asChild
            aria-label="View Case Details"
            onClick={handleViewClick}
          >
            <RouterLink to={`/cases/${caseData.id}`}>
              <Eye className="h-4 w-4 mr-1.5" />
            </RouterLink>
          </Button>

          {/* Share button */}

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleGenerateLink(caseData)}
            aria-label="Share Case"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          {/* Edit button */}
          {permissions?.edit ? (
            <Button
              variant="outline"
              size="icon"
              asChild
              aria-label="Edit Case"
            >
              <RouterLink to={`/cases/${caseData.id}/edit`}>
                <Edit className="h-4 w-4" />
              </RouterLink>
            </Button>
          ) : null}

          {/* Delete button */}
          {permissions?.delete ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete && onDelete(caseData.id!)}
              aria-label="Delete Case"
              className="text-red-600 hover:text-red-800"
            >
              <Trash className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
