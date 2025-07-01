import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
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
import { Eye } from "lucide-react";
import { Pencil } from "lucide-react"; // Add to existing lucide-react imports
import ServiceTagsModal from "../cases/ServiceTagsModal";
import type { Tag } from "@/types/tag";
import axiosInstance from "@/utils/axiosInstance";

const statusStyles: Record<string, string> = {
  "To be Started":
    "bg-blue-100 text-blue-800 hover:!bg-blue-200 hover:!text-blue-900",
  "Detail Required":
    "bg-orange-100 text-orange-800 hover:!bg-orange-200 hover:!text-orange-900",
  "In-Progress":
    "bg-yellow-100 text-yellow-800 hover:!bg-yellow-200 hover:!text-yellow-900",
  Completed:
    "bg-green-100 text-green-800 hover:!bg-green-200 hover:!text-green-900",
};

interface ServiceTableProps {
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

export default function ServiceTable({
  services,
  onDelete,
  onViewRemarks,
  onAddRemark,
  onStatusChange,
  currentUser,
  showTags,
  onRemarkRead,
}: ServiceTableProps) {
  const [updatingServices, setUpdatingServices] = useState<
    Record<string, boolean>
  >({});
  const [serviceTags, setServiceTags] = useState<Record<string, Tag[]>>({});
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedServiceForTags, setSelectedServiceForTags] = useState<
    string | null
  >(null);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);

  const [tagsMap, setTagsMap] = useState<Record<string, Tag>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axiosInstance.get(
          "/tags"
        );
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

  // console.log("caseId :", caseId)

  return (
    <Card>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className=" shadow-sm border-b text-gray-700 text-sm font-semibold uppercase tracking-wide">
              <TableRow>
                <TableHead className="w-[60px] text-center px-3 py-2">
                  Sr
                </TableHead>
                <TableHead className="w-[300px] px-3 py-2">
                  Service Name
                </TableHead>
                <TableHead className="w-[180px] px-3 py-2">Tags</TableHead>
                <TableHead className="w-[200px] px-3 py-2">
                  Current Status
                </TableHead>
                <TableHead className="px-3 py-2">Client / Case Name</TableHead>
                <TableHead className="w-[220px] px-3 py-2">
                  Latest Remark
                </TableHead>
                <TableHead className="text-center px-3 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {services.map((service, idx) => (
                <TableRow
                  key={service._id || idx}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium text-center">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  {/* <TableCell className="font-medium">
                    {Array.isArray(service.tags) && service.tags.length > 0 ? (
                      (() => {
                        // Filter out tagIds that don't exist in tagsMap
                        const validTags = service.tags
                          .map((tagId: string) => tagsMap[tagId])
                          .filter((tag: { name: any }) => tag && tag.name);

                        return validTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {validTags.map(
                              (
                                tag: {
                                  _id: React.Key | null | undefined;
                                  name:
                                    | string
                                    | number
                                    | boolean
                                    | React.ReactElement<
                                        any,
                                        | string
                                        | React.JSXElementConstructor<any>
                                      >
                                    | Iterable<React.ReactNode>
                                    | React.ReactPortal
                                    | null
                                    | undefined;
                                },
                                idx: any
                              ) => (
                                <span
                                  key={tag._id}
                                  className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                                >
                                  {tag.name}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No tags</span>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground">No tags</span>
                    )}
                  </TableCell> */}

                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {Array.isArray(service.tags) &&
                      service.tags.length > 0 ? (
                        (() => {
                          const validTags = service.tags
                            .map((tagId: string) => tagsMap[tagId])
                            .filter((tag: { name: any }) => tag && tag.name);

                          return validTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {validTags.map((tag: Tag) => (
                                <span
                                  key={tag._id}
                                  className="inline-block px-2 py-0.5 rounded text-xs"
                                  style={{
                                    backgroundColor: lightenColor(
                                      tag.color || "#e5e7eb",
                                      0.7
                                    ), // 0.7 = 70% lighter
                                    color: darkenColor(
                                      tag.color || "#a1a1aa",
                                      0.7
                                    ), // 40% darker than original
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              No tags
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground">No tags</span>
                      )}

                      {/* Add pencil icon for editing */}
                      {(currentUser?.role === "Admin" || currentUser?.role === "User") && (
                         
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
                  </TableCell>
                  <TableCell>
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
                        {updatingServices[service.id] ? (
                          <span className="animate-pulse">Updating...</span>
                        ) : (
                          <SelectValue placeholder="Select status" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SERVICE_STATUS).map(([key, status]) => (
                          <SelectItem
                            key={key}
                            value={status}
                            className={`${
                              statusStyles[status] || "bg-white"
                            } my-1`}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {service.parentCase?.unitName || (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {currentUser ? (
                        <>
                          <Remarks
                            caseId={service.parentCase?._id}
                            serviceId={service.id}
                            currentUser={currentUser}
                            serviceName={service.name}
                            onRemarkRead={onRemarkRead}
                          />
                        </>
                      ) : (
                        <>
                          <Remarks
                            caseId={service.parentCase?._id}
                            serviceId={service.id}
                            currentUser={currentUser}
                            serviceName={service.name}
                            onRemarkRead={onRemarkRead}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-xs transition"
                      onClick={() =>
                        navigate(
                          `/cases/${service.parentCase?._id}?from=services`
                        )
                      }
                      title="View Case"
                      type="button"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        View Case
                      </span>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selectedServiceForTags && (
        <ServiceTagsModal
          caseId={
            services.find((s) => s._id === selectedServiceForTags)?.parentCase
              ?._id || ""
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
}
