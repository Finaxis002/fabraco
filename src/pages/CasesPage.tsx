import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  Filter as FilterIcon,
  ChevronDown,
  List,
  LayoutGrid,
  Trash,
} from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import CaseTable from "@/components/cases/case-table";
import CaseCardView from "@/components/cases/case-card-view";
import type {
  Case,
  CaseStatus,
  DashboardFilterStatus,
} from "@/types/franchise";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { getCases, deleteCase } from "@/features/caseSlice";
import { fetchPermissions } from "@/features/permissionsSlice";
import axios from "axios";
import { useParams } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";

const FILTER_OPTIONS: { label: string; value: DashboardFilterStatus }[] = [
  { label: "All Cases", value: "Total" },
  { label: "New Cases", value: "New-Case" },
  { label: "In Progress", value: "In-Progress" },
  { label: "Completed", value: "Completed" },
  { label: "Rejected", value: "Rejected" },
];

type ViewMode = "table" | "card";

export default function CasesPage() {
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    _id?: string;
    name: string;
    role?: string;
    userId?: string;
    permissions?: {
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
      canViewReports?: boolean;
      canAssignTasks?: boolean;
      allCaseAccess?: boolean;
      viewRights?: boolean;
      createCaseRights?: boolean;
      createUserRights?: boolean;
      userRolesAndResponsibility?: boolean;
      remarksAndChat?: boolean;
      canShare?: boolean;
    };
  } | null>(null);

  const [ready, setReady] = useState(false);

  const [unreadRemarks, setUnreadRemarks] = useState<Record<string, number>>(
    {}
  );
  const [unreadChats, setUnreadChats] = useState<Record<string, number>>({});
  const [allChats, setAllChats] = useState<
    Array<{ caseId: string; readBy: string[] }>
  >([]);

  const [allRemarks, setAllRemarks] = useState<
    Array<{
      caseId: string;
      serviceId: string;
      userId: string;
      readBy: string[];
    }>
  >([]);

  const [activeFilter, setActiveFilter] =
    useState<DashboardFilterStatus>("Total");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const location = useLocation();
  const navigate = useNavigate();
  const { caseId } = useParams();

  const dispatch = useDispatch<AppDispatch>();
  const { cases: allCases, loading } = useSelector(
    (state: RootState) => state.case
  );

  useEffect(() => {
    dispatch(getCases());
  }, [dispatch]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const currentUser = userStr ? JSON.parse(userStr) : null;

        if (!token || !currentUser) return;

        const res = await axiosInstance.get("/chats/unread-counts");

        // This should return an object with caseId as key and unread count as value
        const unreadCounts = res.data;

        // Filter out cases with zero unread messages
        const filteredCounts: Record<string, number> = {};
        for (const caseId in unreadCounts) {
          if (unreadCounts[caseId] > 0) {
            filteredCounts[caseId] = unreadCounts[caseId];
          }
        }

        setUnreadChats(filteredCounts);
      } catch (error) {
        console.error("Error fetching unread chats:", error);
      }
    };

    fetchChats();
  }, [currentUser, caseId]); // Add caseId to dependencies to refresh when case changes

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const currentUserId = currentUser?._id || currentUser?.userId || "";

        // Fetch unread remarks
        const remarksRes = await axiosInstance.get("/remarks/recent");
        const remarks = remarksRes.data;

        setAllRemarks(remarks);

        // Count unread remarks per caseId
        const unreadRemarkCounts: Record<string, number> = {};
        remarks.forEach((remark: { readBy: string[]; caseId: string }) => {
          const isRead = remark.readBy?.includes(currentUserId);
          if (!isRead) {
            const caseId = remark.caseId;
            unreadRemarkCounts[caseId] = (unreadRemarkCounts[caseId] || 0) + 1;
          }
        });
        // console.log("Unread Remarks Count Per Case:", unreadRemarkCounts);
        setUnreadRemarks(unreadRemarkCounts);

        // Fetch unread chats
        const chatsRes = await axiosInstance.get("/chats/unread-counts");

        // console.log("Chats API response data:", chatsRes.data);
        const chats = chatsRes.data;

        // Count unread chats per caseId
        const unreadChatCounts: Record<string, number> = {};
        allChats.forEach((chat) => {
          if (
            chat.readBy &&
            currentUserId &&
            !chat.readBy.includes(currentUserId)
          ) {
            unreadChatCounts[chat.caseId] =
              (unreadChatCounts[chat.caseId] || 0) + 1;
          }
        });
        for (const caseId in chats) {
          if (Object.prototype.hasOwnProperty.call(chats, caseId)) {
            unreadChatCounts[caseId] = chats[caseId];
          }
        }

        // console.log("Unread Chats Count Per Case:", unreadChatCounts);
        setUnreadChats(unreadChatCounts);
      } catch (error) {
        console.error("Error fetching unread counts", error);
      }
    };

    if (currentUser) {
      fetchUnreadCounts();
    }
  }, [currentUser]);

  useEffect(() => {
    const markChatsRead = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !caseId) return;

        await axiosInstance.put(`/chats/mark-read/${caseId}`);

        // Update local state to remove this case from unreadChats
        setUnreadChats((prev) => {
          const newUnreads = { ...prev };
          delete newUnreads[caseId];
          return newUnreads;
        });
      } catch (error) {
        console.error("Failed to mark chats as read", error);
      }
    };

    if (caseId) {
      markChatsRead();
    }
  }, [caseId]);

  useEffect(() => {
    const filterFromState = location.state?.filter as
      | DashboardFilterStatus
      | undefined;
    if (filterFromState) {
      setActiveFilter(filterFromState);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const { permissions, loading: permissionsLoading } = useSelector(
    (state: RootState) => state.permissions
  );

  useEffect(() => {
    // console.log("Fetched permissions from redux:", permissions);
  }, [permissions]);

  const isAdmin =
    currentUser?.role?.toLowerCase() === "admin" ||
    currentUser?.name === "Super Admin";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser({
          _id: parsedUser._id, // <-- include this
          name: parsedUser.name,
          role: parsedUser.role,
          userId: parsedUser._id || parsedUser.userId,
        });

        // Skip fetching permissions if Super Admin
        if (
          parsedUser.name !== "Super Admin" &&
          (parsedUser._id || parsedUser.userId)
        ) {
          dispatch(fetchPermissions(parsedUser._id || parsedUser.userId));
        }
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, [dispatch]);

  const canSeeAddButton =
    currentUser?.name === "Super Admin" ||
    permissions?.createCaseRights === true;

  useEffect(() => {
    // console.log("Filtering cases with", {
    //   allCases,
    //   activeFilter,
    //   permissions,
    //   currentUser,
    // });
    if (!allCases || allCases.length === 0 || !currentUser) {
      // setFilteredCases([]);
      return;
    }

    // If super admin, show all cases but apply activeFilter
    let casesToDisplay = allCases;

    // if (currentUser.name === "Super Admin") {
    //   // Super Admin should be able to see all cases, but apply the activeFilter
    //   if (activeFilter && activeFilter !== "Total") {
    //     if (activeFilter === "Completed") {
    //       casesToDisplay = casesToDisplay.filter(
    //         (c) =>
    //           c.status?.toLowerCase() === "completed" ||
    //           c.status?.toLowerCase() === "approved"
    //       );
    //     } else {
    //       casesToDisplay = casesToDisplay.filter(
    //         (c) => c.status?.toLowerCase() === activeFilter.toLowerCase()
    //       );
    //     }
    //   }
    // } else if (!permissions?.allCaseAccess) {
    //   // Non-admin users have restricted access
    //   casesToDisplay = allCases.filter((c) =>
    //     c.assignedUsers?.some((user) => {
    //       if (typeof user === "string") {
    //         return user === currentUser.userId || user === currentUser.name;
    //       } else {
    //         return (
    //           user._id === currentUser.userId ||
    //           user.userId === currentUser.userId ||
    //           user.name === currentUser.name
    //         );
    //       }
    //     })
    //   );
    // }

    const hasAllCaseAccess =
      currentUser?.name === "Super Admin" ||
      permissions?.allCaseAccess === true;

    if (hasAllCaseAccess) {
      // User can see all cases, just filter by active status if set
      if (activeFilter && activeFilter !== "Total") {
        if (activeFilter === "Completed") {
          casesToDisplay = allCases.filter(
            (c) =>
              c.status?.toLowerCase() === "completed" ||
              c.status?.toLowerCase() === "approved"
          );
        } else {
          casesToDisplay = allCases.filter(
            (c) => c.status?.toLowerCase() === activeFilter.toLowerCase()
          );
        }
      } else {
        casesToDisplay = allCases;
      }
    } else {
      // Show only cases assigned to current user
      casesToDisplay = allCases.filter((c) =>
        c.assignedUsers?.some((user) => {
          if (typeof user === "string") {
            return user === currentUser.userId || user === currentUser.name;
          } else {
            return (
              user._id === currentUser.userId ||
              user.userId === currentUser.userId ||
              user.name === currentUser.name
            );
          }
        })
      );

      // Further filter by status if needed
      if (activeFilter && activeFilter !== "Total") {
        if (activeFilter === "Completed") {
          casesToDisplay = casesToDisplay.filter(
            (c) =>
              c.status?.toLowerCase() === "completed" ||
              c.status?.toLowerCase() === "approved"
          );
        } else {
          casesToDisplay = casesToDisplay.filter(
            (c) => c.status?.toLowerCase() === activeFilter.toLowerCase()
          );
        }
      }
    }

    // console.log(" hasAllCaseAccess : ", hasAllCaseAccess);

    // Apply the filter if set (in case the user is not Super Admin)
    if (activeFilter && activeFilter !== "Total") {
      if (activeFilter === "Completed") {
        casesToDisplay = casesToDisplay.filter(
          (c) =>
            c.status?.toLowerCase() === "completed" ||
            c.status?.toLowerCase() === "approved"
        );
      } else {
        casesToDisplay = casesToDisplay.filter(
          (c) => c.status?.toLowerCase() === activeFilter.toLowerCase()
        );
      }
    }
    // console.log("Filtered cases count:", casesToDisplay.length);
    setFilteredCases(casesToDisplay);
  }, [allCases, activeFilter, permissions, currentUser]);

  const handleDelete = async (caseId: string) => {
    if (window.confirm("Are you sure you want to delete this case?")) {
      await dispatch(deleteCase(caseId));
      // Optionally refresh cases after delete
      dispatch(getCases());
    }
  };

  const handleFilterChange = (filterValue: DashboardFilterStatus) => {
    setActiveFilter(filterValue);
  };

  const currentFilterLabel =
    FILTER_OPTIONS.find((opt) => opt.value === activeFilter)?.label || "Filter";

  useEffect(() => {
    if (currentUser && allCases.length > 0) {
      setReady(true);
    }
  }, [currentUser, allCases]);

  const pageActions = (
    <div className="flex flex-wrap items-center gap-2">
      <TooltipProvider>
        {/* Only show Card View icon on mobile, both icons on desktop */}
        <div className="block sm:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Card View"
                disabled
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Card View</TooltipContent>
          </Tooltip>
        </div>
        <div className="hidden sm:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "table" ? "secondary" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
                aria-label="Table View"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Table View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "card" ? "secondary" : "outline"}
                size="icon"
                onClick={() => setViewMode("card")}
                aria-label="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Card View</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FilterIcon className="mr-2 h-4 w-4" /> {currentFilterLabel}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-w-[95vw] right-0 left-auto"
        >
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {FILTER_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => handleFilterChange(option.value)}
              className={cn(
                activeFilter === option.value &&
                  "bg-accent text-accent-foreground"
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {canSeeAddButton && (
        <Button asChild>
          <RouterLink to="/cases/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Add New Case</span>
            <span className="inline xs:hidden">Add</span>
          </RouterLink>
        </Button>
      )}
    </div>
  );

  if (
    loading ||
    !currentUser ||
    !Array.isArray(allCases) ||
    allCases.length === 0
  ) {
    return (
      <>
        <PageHeader
          title="All Cases"
          description="Manage and track all franchise compliance cases."
        >
          {pageActions}
        </PageHeader>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              {[...Array(viewMode === "table" ? 3 : 6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className={
                    viewMode === "table"
                      ? "h-10 w-full"
                      : "h-48 w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.66rem)]"
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }
  if (!ready) {
    return <Skeleton />;
  }

  return (
    <>
      <PageHeader
        title="All Cases"
        description="Manage and track all franchise compliance cases."
      >
        {pageActions}
      </PageHeader>

      {filteredCases.length === 0 ? (
        <div className="text-center p-6 sm:p-10 text-gray-500 text-sm sm:text-base">
          No cases found for this filter.
        </div>
      ) : (
        // On mobile, always show CardView. On desktop, allow switching.
        <div>
          <div className="block sm:hidden">
            <CaseCardView
              cases={filteredCases}
              onDelete={handleDelete}
              unreadRemarks={unreadRemarks}
              unreadChats={unreadChats}
              activeCaseId={caseId}
            />
          </div>
          <div className="hidden sm:block">
            {viewMode === "table" ? (
              <CaseTable
                cases={filteredCases}
                onDelete={handleDelete}
                unreadRemarks={unreadRemarks}
                unreadChats={unreadChats}
                allRemarks={allRemarks.map((r) => ({
                  ...r,
                  _id:
                    (r as any)._id ?? `${r.caseId}-${r.serviceId}-${r.userId}`,
                }))}
                currentUser={currentUser}
              />
            ) : (
              <CaseCardView
                cases={filteredCases}
                onDelete={handleDelete}
                unreadRemarks={unreadRemarks}
                unreadChats={unreadChats}
                activeCaseId={caseId}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
