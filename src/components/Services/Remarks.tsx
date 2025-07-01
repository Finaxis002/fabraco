import React, { useState, useEffect } from "react";
import type { Case } from "@/types/franchise";
import { useSelector } from "react-redux";
import type { RootState } from "../../store"; // adjust path as per your project
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Eye, Loader2, MessageSquarePlus, Plus } from "lucide-react";
import { permission } from "process";
import axiosInstance from "@/utils/axiosInstance";

type Remark = {
  _id: string;
  userId: string;
  userName: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
  readBy: string[]; // Change from 'read?' to 'readBy'
};

interface ServiceRemarksProps {
  caseId: string;
  serviceId: string;
  currentUser: {
    id: string;
    name: string;
  } | null;
  serviceName: string;
  onRemarkRead?: (serviceId: string, userId: string) => void;
}

export default function Remarks({
  caseId,
  serviceId,
  currentUser,
  serviceName,
  onRemarkRead,
}: ServiceRemarksProps) {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [newRemarkText, setNewRemarkText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingRemark, setIsAddingRemark] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRemarkAdded, setNewRemarkAdded] = useState(false);

  const fetchRemarks = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      // Choose API based on token availability
      const url = token
        ? `https://tumbledrybe.sharda.co.in/api/cases/${caseId}/services/${serviceId}/remarks`
        : `https://tumbledrybe.sharda.co.in/api/cases/${caseId}/services/${serviceId}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to load remarks");

      const data: Remark[] = await res.json();
      setRemarks(data);
      setNewRemarkAdded(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDialogOpen) {
      fetchRemarks();
    }
  }, [isDialogOpen]);

  const handleAddRemark = async () => {
    if (!currentUser || !newRemarkText.trim()) return;

    setIsAddingRemark(true);
    const payload = {
      caseId,
      serviceId,
      userId: currentUser.id,
      userName: currentUser.name,
      remark: newRemarkText.trim(),
    };

    try {
      const token = localStorage.getItem("token"); // or wherever you store it

      const res = await axiosInstance.post(
        `/cases/${caseId}/services/${serviceId}/remarks`,
        payload // Just pass your payload object directly
      );

      const newRemark = res.data;

      setRemarks((prev) => [newRemark, ...prev]); // This newRemark will have readBy including currentUser.id

      setNewRemarkText("");
      setNewRemarkAdded(true);
      setIsAddDialogOpen(false);
      // Close the "View All Remarks" dialog after posting
      setIsDialogOpen(false);
    } catch (err) {
      alert((err as Error).message || "Error saving remark");
    } finally {
      setIsAddingRemark(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy 'at' h:mm a");
    } catch {
      return "Just now";
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const remark = useSelector(
    (state: RootState) => state.permissions.permissions?.remarks
  );
  const isSuperAdmin = currentUser?.name === "Super Admin";
  // if (!isSuperAdmin && !remark) {
  //   return (
  //     <Card className="p-6">
  //       <p className="text-center text-red-600 font-semibold">
  //         You do not have permission to access the Remark.
  //       </p>
  //     </Card>
  //   );
  // }

  const markAsRead = async (remarkId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.patch(`/remarks/${remarkId}/read`);

      // Locally update UI: add current user to readBy[] for this remark
      setRemarks((prevRemarks) =>
        prevRemarks.map((r) =>
          r._id === remarkId && !r.readBy.includes(currentUser?.id || "")
            ? { ...r, readBy: [...r.readBy, currentUser?.id || ""] }
            : r
        )
      );

      if (onRemarkRead) {
        onRemarkRead(serviceId, currentUser?.id || "");
      }
    } catch (err) {
      console.error("Failed to mark remark as read", err);
    }
  };

  const hasRemarkPermission = useSelector(
    (state: RootState) => state.permissions.permissions?.remarks
  );

  // Combined check including Super Admin
  const canAddRemark =
    hasRemarkPermission || currentUser?.name === "Super Admin";

  const token = localStorage.getItem("token");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {/* View All Remarks Button */}
        <Button
          size="sm"
          className="h-8 gap-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-sm transition"
          onClick={() => setIsDialogOpen(true)}
        >
          <Eye className="h-4 w-4 text-blue-600" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            View
          </span>
        </Button>
        {/* Add Remark Button and Dialog */}
        {canAddRemark && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 gap-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-sm transition"
              >
                <Plus className="h-4 w-4 text-green-600" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Remark</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  rows={4}
                  value={newRemarkText}
                  onChange={(e) => setNewRemarkText(e.target.value)}
                  placeholder="Write your remark here..."
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddRemark}
                    disabled={
                      !newRemarkText.trim() || isAddingRemark || !canAddRemark
                    }
                  >
                    {isAddingRemark ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Remark"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Remarks for {serviceName}</DialogTitle>
            <DialogDescription>
              You can view and respond to all remarks for this service.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
          )}

          {!loading && remarks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No remarks yet. Be the first to add one!
            </div>
          )}

          <ScrollArea className="flex-1 pr-4 h-[20vh] overflow-auto">
            <div className="space-y-6 py-2">
              {remarks.map((remark) => {
                const isOwnRemark = remark.userId === currentUser?.id;
                return (
                  <div
                    key={remark._id}
                    className={`flex gap-3 rounded-md p-3 ${
                      remark.readBy &&
                      !remark.readBy.includes(currentUser?.id || "")
                        ? "bg-green-100 border border-green-300"
                        : ""
                    }`}
                  >
                    <Avatar className="h-9 w-9 mt-1">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {getUserInitials(remark.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{remark.userName}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(remark.createdAt)}
                        </span>
                        {/* "New" badge - shows if current user hasn't read this remark */}
                        {remark.readBy &&
                          !remark.readBy.includes(currentUser?.id || "") &&
                          token && (
                            <span className="ml-2 inline-block rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
                              New
                            </span>
                          )}
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {remark.remark}
                      </p>

                      {/* "Mark as Read" button - shows if current user hasn't read this remark */}
                      {remark.readBy &&
                        !remark.readBy.includes(currentUser?.id || "") &&
                        token && (
                          <Button
                            variant="outline"
                            size="xs"
                            className="mt-2 text-xs bg-green-600 text-white hover:bg-green-700"
                            onClick={() => markAsRead(remark._id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          {canAddRemark && (
            <div className="pt-4 border-t">
              <div className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {currentUser ? getUserInitials(currentUser.name) : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <Textarea
                    rows={3}
                    value={newRemarkText}
                    onChange={(e) => setNewRemarkText(e.target.value)}
                    placeholder="Add a new remark..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Close
                    </Button>

                    <Button
                      onClick={handleAddRemark}
                      disabled={!newRemarkText.trim()}
                    >
                      {isAddingRemark ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post Remark"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
