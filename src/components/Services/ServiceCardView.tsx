import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SERVICE_STATUS } from "@/lib/statusConfig";
import Remarks from "./Remarks";
import axios from "axios";
import {
  Eye,
  Trash,
  Edit,
  PercentSquare,
  Users,
  User,
  CalendarDays,
  Tag as TagIcon,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ServiceTagsModal from "../cases/ServiceTagsModal";
import axiosInstance from "@/utils/axiosInstance";

type Tag = {
  _id: string;
  name: string;
  color?: string;
};

const statusStyles: Record<string, string> = {
  "To be Started":
    "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
  "Detail Required":
    "bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900",
  "In-Progress":
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900",
  Completed:
    "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
};

interface ServiceCardViewProps {
 services: any[];
  onDelete: (service: any) => void;
  onViewRemarks?: (service: any) => void;
  onAddRemark?: (service: any) => void;
  onStatusChange?: (serviceId: string, newStatus: string) => Promise<void>;
  currentUser?: any;
  showTags?: boolean;
  onRemarkRead?: (serviceId: string, userId: string) => void;
}

// Add this helper at the top of your file
function lightenColor(hex: string, percent: number) {
  // Remove '#' if present
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const num = parseInt(hex, 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * percent);
  let g =
    ((num >> 8) & 0x00ff) + Math.round((255 - ((num >> 8) & 0x00ff)) * percent);
  let b = (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * percent);
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, percent: number) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const num = parseInt(hex, 16);
  let r = (num >> 16) * (1 - percent);
  let g = ((num >> 8) & 0x00ff) * (1 - percent);
  let b = (num & 0x0000ff) * (1 - percent);
  r = Math.max(0, Math.round(r));
  g = Math.max(0, Math.round(g));
  b = Math.max(0, Math.round(b));
  return `rgb(${r},${g},${b})`;
}

export default function ServiceCardView({
  services,
  onDelete,
  onViewRemarks,
  onAddRemark,
  onStatusChange,
  currentUser,
  showTags,
  onRemarkRead,
}: ServiceCardViewProps) {
  const [updatingServices, setUpdatingServices] = useState<
    Record<string, boolean>
  >({});
  const [tagsMap, setTagsMap] = useState<Record<string, Tag>>({});
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedServiceForTags, setSelectedServiceForTags] = useState<
    string | null
  >(null);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [serviceTags, setServiceTags] = useState<Record<string, Tag[]>>({});

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTags = async () => {
      try {
         const response = await axiosInstance.get("/tags"); // Notice the simplified URL
        const tags = response.data;
        const map = tags.reduce((acc: Record<string, Tag>, tag: Tag) => {
          acc[tag._id] = tag;
          return acc;
        }, {});
        setTagsMap(map);
      } catch (error) {
        console.error("Failed to fetch tags", error);
      }
    };
    fetchTags();
  }, []);

  const handleStatusChange = async (serviceId: string, newStatus: string) => {
    try {
      setUpdatingServices((prev) => ({ ...prev, [serviceId]: true }));

      if (onStatusChange) {
        await onStatusChange(serviceId, newStatus);
      }

      toast({
        title: "Status Updated",
        description: `Service status updated to "${newStatus}".`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update service status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingServices((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleEditTags = (service: any) => {
    // Map tag IDs to Tag objects using tagsMap
    const caseId = service.parentCase?._id;
    if (!caseId) {
      toast({
        title: "No Case Selected",
        description: "Cannot edit tags without a case context.",
        variant: "destructive",
      });
      return;
    }
    const tags: Tag[] = (service.tags || [])
      .map((tagId: string) => tagsMap[tagId])
      .filter((tag: Tag) => !!tag);
    // Ensure each tag has a defined color property (fallback to empty string if undefined)
    const tagsWithColor = tags.map((tag) => ({
      ...tag,
      color: tag.color ?? "",
    }));
    setExistingTags(tagsWithColor);
    setSelectedServiceForTags(service._id);
    setTagModalOpen(true);
  };

  if (!services.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
            <p className="text-xl font-semibold text-muted-foreground">
              No services found.
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or add a new service.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service, idx) => {
        const validTags = Array.isArray(service.tags)
          ? service.tags
              .map((tagId: string) => tagsMap[tagId])
              .filter((tag: { name: any }) => tag && tag.name)
          : [];

        const tagSource =
          serviceTags[service._id] ||
          (Array.isArray(service.tags)
            ? service.tags
                .map((tagId: string) => tagsMap[tagId])
                .filter((tag: { name: any }) => tag && tag.name)
            : []);

        return (
           <Card key={service._id || idx}>
            <CardContent key={service._id || idx}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors flex items-center gap-2">
                    {service.name}
                    {/* Optionally, you can add a badge for "last edited" or similar */}
                    {service.isLastEdited && (
                      <span
                        className="bg-blue-600 text-white text-xs px-1.5 rounded-full"
                        title="Recently Edited"
                      >
                        Last Edited
                      </span>
                    )}
                  </CardTitle>
                  <Select
                    value={service.status}
                    onValueChange={(value) =>
                      handleStatusChange(service.id, value)
                    }
                    disabled={updatingServices[service.id]}
                  >
                    <SelectTrigger
                      className={`w-[150px] rounded-md ${
                        statusStyles[service.status] || ""
                      }`}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SERVICE_STATUS).map(([key, status]) => (
                        <SelectItem
                          key={key}
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
                </div>
                <CardDescription className="text-xs text-muted-foreground pt-1">
                  {service.parentCase?.unitName || "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span>{service.parentCase?.ownerName || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>
                    Last Update:{" "}
                    {service.parentCase?.lastUpdate
                      ? new Date(
                          service.parentCase.lastUpdate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PercentSquare className="h-4 w-4 shrink-0" />
                  <span>
                    Progress:{" "}
                    {typeof service.parentCase?.overallCompletionPercentage ===
                    "number"
                      ? `${service.parentCase.overallCompletionPercentage.toFixed(
                          2
                        )}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  <div className="flex flex-wrap gap-2 text-sm">
                    {service.parentCase?.assignedUsers?.length ? (
                      service.parentCase.assignedUsers.map(
                        (user: string | { name?: string }, index: number) => {
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TagIcon className="h-4 w-4 shrink-0" />
                  <div className="flex flex-wrap gap-1 items-center">
                    {tagSource.length > 0 ? (
                      tagSource.map((tag: Tag) => (
                        <Badge
                          key={tag._id}
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: lightenColor(
                              tag.color || "#e5e7eb",
                              0.7
                            ),
                            color: darkenColor(tag.color || "#a1a1aa", 0.7),
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No tags
                      </span>
                    )}
                    {(currentUser?.role === "Admin" ||
                      currentUser?.role === "User") && (
                      <button
                        onClick={() => handleEditTags(service)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Edit tags"
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Remarks
                  </h4>
                  <div className="flex items-center">
                    <Remarks
                      caseId={service.parentCase?._id}
                      serviceId={service.id}
                      currentUser={currentUser}
                      serviceName={service.name}
                      onRemarkRead={onRemarkRead}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="View Case"
                    onClick={() =>
                      navigate(
                        `/cases/${service.parentCase?._id}?from=services`
                      )
                    }
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View Case
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Edit Service"
                    onClick={() =>
                      toast({
                        title: "Edit Service",
                        description: "Edit functionality not implemented.",
                      })
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Delete Service"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => onDelete(service)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </CardContent>

            {selectedServiceForTags && (
              <ServiceTagsModal
                caseId={
                  services.find((s) => s._id === selectedServiceForTags)
                    ?.parentCase?._id || ""
                }
                open={tagModalOpen}
                onClose={() => setTagModalOpen(false)}
                // caseId={caseId}
                serviceId={selectedServiceForTags}
                existingTags={existingTags.map((tag) => ({
                  ...tag,
                  color: tag.color ?? "",
                }))}
                onTagsUpdated={(updatedTags) => {
                  // Update tags for the service in your local state
                  setTagModalOpen(false);
                  setSelectedServiceForTags(null);
                  setExistingTags([]);
                  setServiceTags((prev) => ({
                    ...prev,
                    [selectedServiceForTags]: updatedTags,
                  }));
                }}
                currentUser={currentUser}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}
