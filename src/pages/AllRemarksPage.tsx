import React, { useState, useEffect } from "react";
import { Eye, Trash2, MessageSquare } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import axiosInstance from "@/utils/axiosInstance";

export default function AllRemarksPage() {
  const [remarks, setRemarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser?.id || currentUser?._id;

  const unreadCount = remarks.filter(
    (r) => !(r.readBy ?? []).includes(currentUserId)
  ).length;

  useEffect(() => {
    document.title = `All Remarks | ${APP_NAME}`;
    fetchAllRemarks();
  }, []);

const fetchAllRemarks = async () => {
  setLoading(true); // Best to set at the top for instant feedback
  try {
    // No need to get token or set headers manually if your axiosInstance already does it via interceptor!
    const res = await axiosInstance.get("/remarks/recent");

    // Axios puts response data in res.data
    setRemarks(res.data);
  } catch (err: any) {
    toast({
      title: "Error",
      description: err?.response?.data?.message || err.message || "Unknown error",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  const markAllAsRead = async () => {
    await axiosInstance.get(`/remarks/read-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setRemarks((prev) =>
      prev.map((r) =>
        !(r.readBy ?? []).includes(currentUserId)
          ? { ...r, readBy: [...(r.readBy || []), currentUserId] }
          : r
      )
    );
  };

  const deleteRemark = async (id: string) => {
    await axiosInstance.get(`/remarks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setRemarks((prev) => prev.filter((r) => r._id !== id));
  };

  const deleteAllRemarks = async () => {
    await axiosInstance.get(`/remarks`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setRemarks([]);
  };

  return (
    <>
      <PageHeader
        title="Remarks"
        description={`You have ${unreadCount} unread remark(s).`}
      >
        <div className="flex gap-2">
          {remarks.length > 0 && (
            <>
              <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
                Mark All as Read
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            All Remarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : remarks.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-280px)] pr-0 sm:pr-4">
              <ul className="space-y-4">
                {remarks.map((remark) => {
                  const isUnread = !(remark.readBy ?? []).includes(
                    currentUserId
                  );

                  return (
                    <li
                      key={remark._id}
                      className={`p-3 sm:p-4 border rounded-lg shadow-sm ${
                        isUnread ? "bg-blue-50" : "bg-card"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <Avatar className="h-9 w-9 mt-1 sm:mt-0">
                          <AvatarFallback>
                            {remark.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex  sm:flex-row justify-between sm:items-center gap-1">
                            <div>
                              <p className="font-semibold truncate">
                                {remark.userName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(remark.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {isUnread && (
                              <Badge
                                variant="default"
                                className="text-xs mt-1 sm:mt-0 w-[50px] text-center"
                              >
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                            {remark.remark}
                          </p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <Button variant="outline" size="xs" asChild>
                              <RouterLink
                                to={`/cases/${remark.caseId}?serviceId=${remark.serviceId}`}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                <span className=" xs:inline">View</span>
                              </RouterLink>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">
                No Remarks
              </p>
              <p className="text-sm text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
