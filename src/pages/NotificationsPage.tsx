import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/page-header";
import { MOCK_NOTIFICATIONS, APP_NAME } from "@/lib/constants";
import type { AppNotification } from "@/types/franchise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  FilePlus,
  UserPlus,
  AlertCircle,
  Activity,
  Eye,
  Trash2,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import axiosInstance from "@/utils/axiosInstance";

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
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

const NOTIFICATION_ICONS_PAGE: Record<
  AppNotification["type"],
  React.ElementType
> = {
  update: CheckCircle2,
  creation: FilePlus,
  assign: UserPlus,
  deletion: AlertCircle,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    document.title = `Notifications | ${APP_NAME}`;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance(
          "/notifications",
        );
        if (!res.data) throw new Error("Failed to fetch notifications");
        const data = res.data;

        // Normalize _id to id for React keys & logic
        const normalizedNotifications = Array.isArray(data)
          ? data.map((n) => ({ ...n, id: n._id }))
          : [];

        setNotifications(normalizedNotifications);
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
        setNotifications([]);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const getCaseName = (caseId?: string): string | undefined => {
    if (!caseId) return undefined;
    const caseItem = notifications.find((c) => c.id === caseId);
    return caseItem?.unitName;
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.put(
        `/notifications/${id}/read`,
      );
      // Update local state after successful API call
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      toast({ title: "Notification marked as read" });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axiosInstance.put(
        "/notifications/read-all",
      
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      toast({ title: "All Notifications Marked as Read" });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.delete(
        `/notifications/${id}`,
      );


      // Only update local state if API call succeeds
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Notification Deleted", variant: "destructive" });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.delete(
        `/notifications`,
       
      );

      if (!res.data) {
        throw new Error("Failed to delete all notifications");
      }

      // Only update local state if API call succeeds
      setNotifications([]);
      toast({ title: "All Notifications Deleted", variant: "destructive" });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Notifications"
          description="Loading your recent activity..."
        />
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start space-x-4 p-4 border rounded-lg"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-28 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`You have ${unreadCount} unread notification(s).`}
      >
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All as Read ({unreadCount})
            </Button>
          )}
          {notifications.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    all your notifications.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllNotifications}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </PageHeader>
      <Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <Bell className="mr-2 h-5 w-5 text-primary" />
      Notification Feed
    </CardTitle>
  </CardHeader>
  <CardContent>
    {notifications.length > 0 ? (
      <ScrollArea className="h-[calc(100vh-280px)] pr-0 sm:pr-4">
        {/* Responsive: Remove right padding on mobile, keep on desktop */}
        <ul className="space-y-4">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS_PAGE[notification.type] || Activity;
            const caseName = getCaseName(notification.caseId);
            const messagePrefix = caseName ? (
              <RouterLink
                to={`/cases/${notification.caseId}`}
                className="font-semibold text-primary hover:underline break-all"
              >{`Case '${caseName}'`}</RouterLink>
            ) : (
              ""
            );

            return (
              <li
                key={notification.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                  !notification.read
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card"
                }`}
              >
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10 mt-1 sm:mt-0">
                    <AvatarFallback
                      className={`${
                        !notification.read
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div className="min-w-0">
                      <div className="text-sm leading-snug break-words">
                        {messagePrefix}
                        {messagePrefix && ":"}
                        {notification.message
                          .split(";")
                          .filter(Boolean)
                          .map((change, idx) => (
                            <div
                              key={idx}
                              className="border rounded-md p-2 my-1 break-words"
                            >
                              {change.trim()}
                              {idx !==
                              notification.message.split(";").length - 1
                                ? ";"
                                : ""}
                            </div>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge
                        variant="default"
                        className="text-xs h-5 shrink-0 mt-1 sm:mt-0 w-[50px]"
                      >
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {notification.caseId && (
                      <Button variant="outline" size="xs" asChild>
                        <RouterLink to={`/cases/${notification.caseId}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> View Case
                        </RouterLink>
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() =>
                          notification.id && markAsRead(notification.id)
                        }
                      >
                        Mark as Read
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2 py-1"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> 
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Notification?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this
                            notification? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              notification.id &&
                              deleteNotification(notification.id)
                            }
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    ) : (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
        <Bell className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold text-muted-foreground">
          No Notifications
        </p>
        <p className="text-sm text-muted-foreground">
          You're all caught up! New notifications will appear here.
        </p>
      </div>
    )}
  </CardContent>
</Card>
    </>
  );
}
