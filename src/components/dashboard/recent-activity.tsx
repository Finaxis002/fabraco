import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, MessageSquareText, FileText } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

function getRelativeTime(dateString: string) {
  if (!dateString) return "Unknown time";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface RecentCase {
  _id?: string;
  unitName?: string;
  overallStatus?: string;
  lastUpdate: string;
  latestRemark?: string; // 👈 Add this
}

interface RecentRemark {
  _id: string;
  caseId: string;
  caseName: string;
  remark: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RecentActivityProps {
  recentCases: RecentCase[];
  loading: boolean;
}

export default function RecentActivity({
  recentCases,
  loading,
}: RecentActivityProps) {
  const [remarks, setRemarks] = useState<RecentRemark[]>([]);
  const [remarksLoading, setRemarksLoading] = useState(true);

  useEffect(() => {
    const fetchRecentRemarks = async () => {
      try {
        const res = await axiosInstance.get("/remarks/recent");
        setRemarks(res.data);
      } catch (error) {
        console.error("Error fetching recent remarks:", error);
      } finally {
        setRemarksLoading(false);
      }
    };

    fetchRecentRemarks();
  }, []);

  // Combine cases and remarks into a single timeline
  const combinedActivities = [
    ...recentCases.map((c) => ({
      type: "case" as const,
      id: c._id || "",
      title: c.unitName || "",
      status: c.overallStatus || "",
      date: c.lastUpdate,
      content: c.latestRemark || "",
    })),
    ...(Array.isArray(remarks)
      ? remarks.map((r) => ({
          type: "remark" as const,
          id: r.caseId,
          title: r.caseName,
          status: r.status,
          date: r.createdAt, // <-- use createdAt instead of updatedAt
          content: r.remark,
        }))
      : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isLoading = loading || remarksLoading;

  return (
    // ...existing code...
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest case updates and remarks from your team.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-72px)]">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : combinedActivities.length > 0 ? (
          <ScrollArea className="flex-grow pr-0 md:pr-4">
            <ul className="space-y-4">
              {combinedActivities.slice(0, 3).map((activity) => (
                <li
                  key={`${activity.type}-${activity.id}-${activity.date}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Vertical indicator - different colors for cases vs remarks */}
                  <div
                    className={`
                  w-2 h-8 sm:h-12 rounded-full
                  ${
                    activity.type === "case"
                      ? activity.status === "Completed" ||
                        activity.status === "Approved"
                        ? "bg-green-500"
                        : activity.status === "Pending"
                        ? "bg-yellow-500"
                        : activity.status === "In-Progress"
                        ? "bg-blue-500"
                        : activity.status === "Rejected"
                        ? "bg-red-500"
                        : "bg-gray-300"
                      : "bg-purple-500"
                  }
                `}
                  ></div>

                  <div className="flex flex-col flex-grow min-w-0">
                    <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-800 truncate">
                      {activity.type === "case" ? "Status" : "Remark added"}:{" "}
                      <span
                        className={`font-medium ${
                          activity.type === "case"
                            ? activity.status === "Completed" ||
                              activity.status === "Approved"
                              ? "text-green-600"
                              : activity.status === "Pending"
                              ? "text-yellow-600"
                              : activity.status === "In-Progress"
                              ? "text-blue-600"
                              : activity.status === "Rejected"
                              ? "text-red-600"
                              : "text-gray-600"
                            : "text-purple-600"
                        }`}
                      >
                        {activity.status}
                      </span>{" "}
                      &mdash; Updated {getRelativeTime(activity.date)}
                    </p>

                    {activity.content && (
                      <div className="mt-1">
                        <p
                          className={`text-xs sm:text-sm ${
                            activity.type === "remark"
                              ? "text-purple-700 bg-purple-50 p-2 rounded"
                              : "text-muted-foreground"
                          } truncate`}
                        >
                          {activity.type === "remark" ? "💬 " : "📝 "}
                          {activity.content}
                        </p>
                      </div>
                    )}
                  </div>

                  <RouterLink
                    to={`/cases/${activity.id}`}
                    className="text-xs sm:text-sm font-medium text-primary hover:underline whitespace-nowrap mt-2 sm:mt-0"
                  >
                    View Details →
                  </RouterLink>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No recent activity to display.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    // ...existing code...
  );
}
