import React, { useState, useEffect, useRef } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { APP_NAME } from "@/lib/constants";
import type { Case, User } from "@/types/franchise";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusIndicator from "@/components/dashboard/status-indicator";
import {
  ArrowLeft,
  Users as UsersIcon,
  Briefcase,
  Info,
  CalendarDays,
  FileText,
  Building2,
  MessageSquare,
  Share2,
} from "lucide-react";
import { useSearchParams, useLocation } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import CaseChat from "@/components/cases/case-chat"; // Import CaseChat
import { AppDispatch, RootState } from "@/store";
import { fetchPermissions } from "@/features/permissionsSlice";
import { useDispatch, useSelector } from "react-redux";
import CaseServices from "@/components/cases/CaseServices";
import axiosInstance from "@/utils/axiosInstance";
import axios from "axios";

function getFormattedDate(dateString?: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CaseDetailPageProps {
  isPublic?: boolean;
}

export default function CaseDetailPage({
  isPublic = false,
}: CaseDetailPageProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | undefined | null>(null); // null for loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [unreadRemarkCount, setUnreadRemarkCount] = useState<number>(0);
  const initialHighlightServiceId = searchParams.get("serviceId");
  const [highlightServiceId, setHighlightServiceId] = useState<
    string | undefined
  >(undefined);
  const [allRemarks, setAllRemarks] = useState<
    Array<{ serviceId: string; readBy: string[] }>
  >([]);

  const navigate = useNavigate();

 useEffect(() => {
  const fetchAllRemarks = async () => {
    try {
      const res = await axiosInstance.get("/remarks/recent");
      
      // With axios, successful responses come with status 200-299
      // The data is directly available in res.data
      setAllRemarks(res.data);

      // Count only unread remarks for pulsing dot
      const unread = res.data.filter((r: any) => !r.read).length;
      setUnreadRemarkCount(unread);

    } catch (err) {
      console.error("Error loading recent remarks:", err);
      // Optional: Set error state if you want to display it in UI
      // setError("Failed to load remarks");
    }
  };

  if (caseId) fetchAllRemarks();
}, [caseId]);

  const handleRemarkRead = (serviceId: string, userId: string) => {
    setAllRemarks((prevRemarks) =>
      prevRemarks.map((remark) =>
        remark.serviceId === serviceId && !remark.readBy.includes(userId)
          ? { ...remark, readBy: [...remark.readBy, userId] }
          : remark
      )
    );
  };

  // Reactively watch for changes in URL params (including when on the same page)
  useEffect(() => {
    const serviceId = searchParams.get("serviceId");
    if (serviceId) {
      console.log("🆕 Service ID detected from URL param:", serviceId);
      setHighlightServiceId(serviceId);

      // Optionally: Clean up URL param after reading
      const params = new URLSearchParams(window.location.search);
      params.delete("serviceId");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  // Remove from URL but preserve in state
  useEffect(() => {
    if (initialHighlightServiceId) {
      const params = new URLSearchParams(window.location.search);
      params.delete("serviceId");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    // console.log("✅ Highlight Service ID:", highlightServiceId);
  }, [highlightServiceId]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const { permissions, loading: permissionsLoading } = useSelector(
    (state: RootState) => state.permissions
  );

  // 3. Add status validation if needed (optional)
  useEffect(() => {
    if (caseData) {
      // Validate and normalize status if needed
      if (
        caseData.status &&
        !["New-Case", "In-Progress", "Completed", "Rejected"].includes(
          caseData.status
        )
      ) {
        console.warn(`Invalid case status: ${caseData.status}`);
        // You might want to set a default status here
        // setCaseData({...caseData, status: "New-Case"});
      }
    }
  }, [caseData]);

  useEffect(() => {
    if (!caseData) return;

    let newStatus = caseData.status || "New-Case";
    const percentage = caseData.overallCompletionPercentage ?? 0;

    if (percentage === 100) {
      newStatus = "Completed";
    } else if (percentage > 50 && percentage < 100) {
      newStatus = "In-Progress";
    } else {
      newStatus = "New-Case";
    }

    // Update status in caseData only if it has changed to avoid infinite loop
    if (caseData.status !== newStatus) {
      setCaseData((prev) =>
        prev ? { ...prev, status: newStatus, overallStatus: newStatus } : prev
      );
    }
  }, [caseData?.overallCompletionPercentage]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser({
          id: parsedUser._id || parsedUser.userId || "", // Required by User type
          name: parsedUser.name,
          email: parsedUser.email || "", // Required by User type
          role: parsedUser.role,
          userId: parsedUser._id || parsedUser.userId, // Your additional field if neede
          permissions: {
            // Remove the ? since we're defining the object
            canViewAllCases: false,
            canCreateCase: false,
            canEditCase: false,
            canDeleteCase: false,
            canManageUsers: false,
            canManageSettings: false,
          },
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

  useEffect(() => {
    if (caseData && caseData.unitName) {
      document.title = `Case: ${caseData.unitName} | ${APP_NAME}`;
    } else if (caseData === undefined) {
      document.title = `Case Not Found | ${APP_NAME}`;
    }
  }, [caseData]);

 const fetchCaseById = async () => {
  setLoading(true);
  try {
    const response = await axiosInstance.get(`/cases/${caseId}`);
    setCaseData(response.data);
  } catch (err) {
    setCaseData(undefined);
    
    // Optional: More detailed error handling
    if (axios.isAxiosError(err)) {
      console.error("Failed to fetch case:", err.response?.data?.message || err.message);
    } else {
      console.error("Failed to fetch case:", err);
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (caseId) fetchCaseById();
  }, [caseId]);

  // Pass this function as onUpdate to child
  const handleCaseUpdate = () => {
    fetchCaseById();
  };

  if (loading || caseData === null) {
    return (
      <>
        <PageHeader
          title="Loading Case Details..."
          description="Please wait while we fetch the case information."
        >
          <Button asChild variant="outline">
            <RouterLink to="/cases">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Cases
            </RouterLink>
          </Button>
        </PageHeader>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-28 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>{" "}
            {/* Chat Skeleton */}
          </div>
        </div>
      </>
    );
  }

  if (caseData === undefined) {
    return (
      <>
        <PageHeader
          title="Case Not Found"
          description="The requested case could not be found."
        />
        <div className="text-center">
          <p className="mb-4">
            The case with ID "{caseId}" does not exist or you do not have
            permission to view it.
          </p>
          <Button asChild>
            <RouterLink to="/cases">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Cases
            </RouterLink>
          </Button>
        </div>
      </>
    );
  }

  const assignedUserObjects = (caseData.assignedUsers ?? [])
    .filter(
      (
        user
      ): user is {
        userId: string;
        _id: string;
        name?: string;
        avatarUrl?: string;
      } =>
        typeof user === "object" &&
        user !== null &&
        "userId" in user &&
        "_id" in user
    )
    .map((user) => ({
      id: user.userId,
      name: user.name,
      role: "Team Member",
      avatarUrl: user.avatarUrl || "",
    }));

  const userRole = localStorage.getItem("userRole");

  // Show share button only if not on client page (easy string check)
  const isClientPage = location.pathname.startsWith("/client/");
  // Share handler
  const handleShareRemarkLink = (serviceId: string) => {
    // Link opens the client page at the relevant service's remarks
    const link = `${window.location.origin}/client/cases/${caseId}?serviceId=${serviceId}`;
    navigator.clipboard.writeText(link);
    // Show toast (implement with your own toast system)
    // toast({ title: "Link Copied!", description: "Remark link copied to clipboard." });
    alert("Link copied to clipboard:\n" + link);
  };

  return (
    <>
      <PageHeader
        title={`Case Details: ${caseData.unitName}`}
        description={`SRN: ${caseData.srNo}`}
      >
        {userRole && (
          <Button asChild variant="outline">
            <RouterLink to="/cases">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Cases
            </RouterLink>
          </Button>
        )}
        <Button
          variant="default"
          className="ml-2"
          onClick={() => navigate(`/cases/${caseId}/edit`)}
        >
          Edit Case
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Franchise & Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <strong>Unit Name:</strong> {caseData.unitName}
                </div>
                <div>
                  <strong>Owner Name:</strong> {caseData.ownerName}
                </div>
                <div className="sm:col-span-2">
                  <strong>Franchise Address:</strong>{" "}
                  {caseData.franchiseAddress}
                </div>
                <div>
                  <strong>State Head:</strong> {caseData.stateHead || "N/A"}
                </div>
                <div>
                  <strong>Authorized Person:</strong>{" "}
                  {caseData.authorizedPerson || "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                Compliance Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.services && caseData.services.length > 0 ? (
                <CaseServices
                  caseId={caseId!}
                  caseName={caseData.unitName}
                  services={caseData.services}
                  currentUser={currentUser}
                  overallStatus={caseData.overallStatus ?? "New-Case"}
                  overallCompletionPercentage={
                    caseData.overallCompletionPercentage ?? 50
                  }
                  onUpdate={handleCaseUpdate}
                  highlightServiceId={highlightServiceId || undefined}
                  allRemarks={allRemarks}
                  onRemarkRead={handleRemarkRead} // ✅ new
                  showTags={true}
                  showShareButton={!isClientPage} // <-- ADD THIS PROP
                  onShareRemarkLink={handleShareRemarkLink} // <-- ADD THIS PROP
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No services listed for this case.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Status:</span>
                <StatusIndicator
                  status={caseData.overallStatus ?? "New-Case"}
                  showText={true}
                  className="text-sm px-3 py-1"
                />
              </div>
              {caseData.reasonForStatus && (
                <div>
                  <p className="text-sm font-medium mb-1">Reason/Note:</p>
                  <p className="text-xs p-2 bg-muted/50 rounded-md border text-muted-foreground">
                    {caseData.reasonForStatus}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />{" "}
                  Last Updated:
                </p>
                <p className="text-sm text-foreground">
                  {getFormattedDate(caseData.lastUpdate)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                Assigned Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedUserObjects.length > 0 ? (
                <ul className="space-y-3">
                  {assignedUserObjects.map((user) => (
                    <li key={user.id} className="flex items-center gap-3">
                      <img
                        src={
                          user.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.name || ""
                          )}&background=random`
                        }
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                        data-ai-hint="user avatar"
                      />
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.role}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No users assigned to this case.
                </p>
              )}
            </CardContent>
          </Card>

          {caseData.viewLink && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Public View Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  A shareable link for external viewers (if applicable).
                </p>
                <Button variant="outline" asChild className="w-full">
                  <RouterLink
                    to={caseData.viewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Public Link
                  </RouterLink>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Team Chat Section */}
      <div className="mt-6">
        {caseData && caseId && currentUser && (
          <CaseChat
            caseId={caseId}
            currentUser={currentUser}
            assignedUsers={(caseData.assignedUsers || []).map((user: any) => ({
              id: user.userId,
              name: user.name,
              email: user.email || "",
              avatarUrl: user.avatarUrl || "",
              role: user.role || "Team Member",
            }))}
          />
        )}
      </div>
    </>
  );
}
