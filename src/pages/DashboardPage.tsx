import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PageHeader from "@/components/ui/page-header";
import { APP_NAME } from "@/lib/constants";
import type {
  Case,
  User,
  AppNotification,
  ServiceStatus,
  DashboardFilterStatus,
} from "@/types/franchise";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/dashboard/stat-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import ComplianceStatusOverview from "@/components/dashboard/compliance-status-overview";
import { Briefcase, Users, Clock, Loader } from "lucide-react"; // Removed Activity, BarChart3 for now
import HeaderWithBranding from "@/components/dashboard/HeaderWithBranding";
import useRoleWatcher from "@/components/dashboard/useRoleWatcher";
import { fetchPermissions } from "@/features/permissionsSlice";
import { RootState } from "@/store";

interface CaseStats {
  totalCases: number;
  completedCases: number; // Includes "Approved"
  NewCases: number;
  inProgressCases: number;
  rejectedCases: number;
  completionPercentage: number;
}

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?._id;
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}") as User;
  const userRole = localStorage.getItem("userRole") || "";

  useRoleWatcher(token, userId);

  const permissions = useSelector((state: RootState) => state.permissions.permissions);


  const allCaseAccess =
    userRole.toLowerCase() === "admin" ||
    currentUser.role?.toLowerCase() === "super admin" ||
    (permissions && permissions.allCaseAccess); // From Redux or however you fetch

  const casesToCount = useMemo(() => {
  if (allCaseAccess) {
    return cases;
  }
  // Only assigned cases
  return cases.filter((c) =>
    c.assignedUsers?.some((user) => {
      if (typeof user === "string") {
        return user === currentUser._id || user === currentUser.userId || user === currentUser.name;
      }
      return (
        user._id === currentUser._id ||
        user.userId === currentUser.userId ||
        user.name === currentUser.name
      );
    })
  );
}, [cases, allCaseAccess, currentUser]);



  useEffect(() => {
    document.title = `Dashboard | ${APP_NAME}`;
    const fetchData = async () => {
      setLoading(true);
      try {
         const token = localStorage.getItem("token");

        // Fetch cases from API
        const casesResponse = await fetch(
          "https://tumbledrybe.sharda.co.in/api/cases",
          {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
        );
        const casesData = await casesResponse.json();

        // Fetch users from API
        const usersResponse = await fetch(
          "https://tumbledrybe.sharda.co.in/api/users",
          {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
        );
        const usersData = await usersResponse.json();

        setCases(casesData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [complianceStatusCounts, setComplianceStatusCounts] = useState<{
    "New-Case": number;
    "In-Progress": number;
    Completed: number;
    Approved: number;
    Rejected: number;
  }>({
    "New-Case": 0,
    "In-Progress": 0,
    Completed: 0,
    Approved: 0,
    Rejected: 0,
  });

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(
          "https://tumbledrybe.sharda.co.in/api/cases",
          {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
        );
        if (!res.ok) throw new Error("Failed to fetch cases");

        const data = await res.json();
        setCases(data);

        // 🔍 Count by `status`
        const counts = {
          "New-Case": 0,
          "In-Progress": 0,
          Completed: 0,
          Approved: 0,
          Rejected: 0,
        };

        data.forEach((c: any) => {
          const rawStatus = c.status?.trim(); // No need to convert to lowercase here
          switch (rawStatus) {
            case "New-Case":
              counts["New-Case"]++;
              break;
            case "In-Progress":
              counts["In-Progress"]++;
              break;
            case "Completed":
              counts.Completed++;
              break;
            case "Approved":
              counts.Approved++;
              counts.Completed++; // Optional: Count Approved as Completed too
              break;
            case "Rejected":
              counts.Rejected++;
              break;
          }
        });

        setComplianceStatusCounts(counts);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchCases();
  }, []);

  // (Moved currentUser and userRole declarations above)

  const isSuperAdmin =
    userRole.toLowerCase() === "admin" ||
    currentUser.role?.toLowerCase() === "super admin";

  const filteredCases = useMemo(() => {
    if (isSuperAdmin) return cases;

    return cases.filter((c) =>
      c.assignedUsers?.some((user) => {
        if (typeof user === "string") {
          return user === currentUser._id || user === currentUser.name;
        } else {
          return (
            user._id === currentUser._id ||
            user.userId === currentUser.userId ||
            user.name === currentUser.name
          );
        }
      })
    );
  }, [cases, currentUser, isSuperAdmin]);

const caseStats: CaseStats = useMemo(() => {
  const totalCases = casesToCount.length;
  const completedCases = casesToCount.filter(
    (c) => c.status === "Completed"
  ).length;
  const NewCases = casesToCount.filter(
    (c) => c.status === "New-Case"
  ).length;
  const inProgressCases = casesToCount.filter(
    (c) => c.status === "In-Progress"
  ).length;
  const rejectedCases = casesToCount.filter(
    (c) => c.status === "Rejected"
  ).length;
  const completionPercentage =
    totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  return {
    totalCases,
    completedCases,
    NewCases,
    inProgressCases,
    rejectedCases,
    completionPercentage,
  };
}, [casesToCount]);


  const handleStatCardClick = (filterStatus?: DashboardFilterStatus) => {
    navigate("/cases", {
      state: {
        filter: filterStatus || "Total",
        restrictToUser: !isSuperAdmin, // can be used on /cases page
        userId: !isSuperAdmin ? currentUser._id : undefined,
      },
    });
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Loading Dashboard..."
          description="Please wait while we gather the latest data."
        />
        <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-[380px] rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-[380px] rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
     <div className="flex flex-col gap-4 ">
      {/* <TestNotificationButton /> */}
       <HeaderWithBranding currentUser={{ name: currentUser.name }} />

      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={caseStats.totalCases.toString()}
          icon={Briefcase}
          description={`${caseStats.completionPercentage}% overall completion`}
          progress={caseStats.completionPercentage}
          onClick={() => handleStatCardClick("Total")}
        />
        <StatCard
          title="New Cases"
          value={caseStats.NewCases.toString()}
          icon={Clock}
          description="Awaiting action"
          onClick={() => handleStatCardClick("New-Case")}
        />
        <StatCard
          title="In-Progress Cases"
          value={caseStats.inProgressCases.toString()}
          icon={Loader}
          description="Currently being processed"
          onClick={() => handleStatCardClick("In-Progress")}
        />
        {isSuperAdmin && (
          <StatCard
            title="Total Users"
            value={users.length.toString()}
            icon={Users}
            description="Across all roles"
            onClick={() => navigate("/users")}
          />
        )}
      </div>
     </div>

     <div className="flex flex-wrap gap-8">
        <div className="w-full lg:w-[calc(66.666%-20px)]">
          <RecentActivity
            recentCases={filteredCases
              .filter(
                (c) => typeof c._id === "string" && c._id.trim().length > 0
              )
              .map((c) => ({
                _id: c._id!,
                unitName: c.unitName,
                overallStatus: c.status ?? "",
                lastUpdate: c.lastUpdate,
              }))}
            loading={loading}
          />
        </div>
        <div className="w-full lg:w-[calc(33.333%-20px)]">
          <ComplianceStatusOverview
            totalCases={filteredCases.length}
            newCaseCount={
              filteredCases.filter(
                (c) => c.status?.toLowerCase() === "new-case"
              ).length
            }
            inProgressCount={
              filteredCases.filter(
                (c) => c.status?.toLowerCase() === "in-progress"
              ).length
            }
            completedCount={
              filteredCases.filter((c) =>
                ["completed", "approved"].includes(
                  (c.status ?? "").toLowerCase()
                )
              ).length
            }
            rejectedCount={
              filteredCases.filter(
                (c) => c.status?.toLowerCase() === "rejected"
              ).length
            }
            onStatusClick={(status) => {
              // Map StatusType to DashboardFilterStatus
              let mappedStatus: DashboardFilterStatus | undefined;
              switch (status) {
                case "New-Case":
                  mappedStatus = "New-Case";
                  break;
                case "In-Progress":
                  mappedStatus = "In-Progress";
                  break;
                case "Completed":
                  mappedStatus = "Completed";
                  break;
                case "Rejected":
                  mappedStatus = "Rejected";
                  break;
                default:
                  mappedStatus = undefined;
              }
              handleStatCardClick(mappedStatus);
            }}
          />
        </div>
      </div>
    </>
  );
}
