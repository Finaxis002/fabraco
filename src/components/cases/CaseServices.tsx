import React, { useState, useEffect, useRef } from "react";
import { SERVICE_STATUS, STATUS_COLORS } from "@/lib/statusConfig";
import { Progress } from "@/components/ui/progress";
import ServiceRemarks from "./ServiceRemarks";
import { useAppDispatch } from "../../hooks/hooks";
import { updateCase } from "../../features/caseSlice";
import { useToast } from "@/hooks/use-toast";
import type { CaseStatus, Service, ServiceStatus } from "@/types/franchise"; // wherever it is declared
import { useSelector } from "react-redux";
import type { RootState } from "../../store"; // adjust path as per your project
import { fetchPermissions } from "@/features/permissionsSlice";
import ServiceTagsModal from "./ServiceTagsModal";
import axios from "axios";

// Define the Tag type according to your tag structure
type Tag = {
  _id: string;
  name: string;
  color: string;
};
import { Tag as TagIcon } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

interface CaseServicesProps {
  caseId: string;
  caseName?: string;
  unitName?: string;
  services: Service[];
  overallStatus: string;
  overallCompletionPercentage: number;
  currentUser: any;
  onUpdate?: () => void;
  onRemarkRead?: (serviceId: string, userId: string) => void;
  highlightServiceId?: string;
  allRemarks: Array<{
    serviceId: string;
    readBy: string[]; // ✅ fixed from read: boolean
  }>;
  showTags?: boolean;
  showShareButton?: boolean;
  onShareRemarkLink?: (serviceId: string) => void;
  highlightRemarkId?: string; // Add this!
}

const statusStyles: Record<string, string> = {
  "To be Started":
    "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 text-xs",
  "Detail Required":
    "bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900 text-xs",
  "In-Progress":
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 text-xs", // Fixed
  Completed:
    "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 text-xs",
};
const CaseServices: React.FC<CaseServicesProps> = ({
  caseId,
  caseName,
  unitName,
  services,
  overallStatus,
  overallCompletionPercentage,
  currentUser,
  onUpdate,
  onRemarkRead, // ✅ Add this missing line
  highlightServiceId,
  allRemarks = [],
  showTags, // <-- Add this line
  highlightRemarkId, // <-- ADD THIS LINE!
}) => {
  // const [showAll, setShowAll] = useState(false);
  const [showAll, setShowAll] = useState(() => !!highlightServiceId);

  const [localServices, setLocalServices] = useState(services);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingServices, setUpdatingServices] = useState<
    Record<string, boolean>
  >({});
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedServiceForTags, setSelectedServiceForTags] = useState<
    string | null
  >(null);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);

  const [tagsMap, setTagsMap] = useState<Record<string, Tag>>({});

  const [serviceTags, setServiceTags] = useState<Tag[]>([]);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const serviceRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // Fetch all tags when component mounts
  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const response = await axiosInstance.get("/tags");
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

    fetchAllTags();
  }, []);

  const handleRemoveTag = async (serviceId: string, tagId: string) => {
    try {
      setIsRemoving(tagId);

      await axiosInstance.delete(
        `/cases/${caseId}/services/${serviceId}/tags/${tagId}`
      );

      // Update UI
      setLocalServices((prevServices) =>
        prevServices.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                tags: service.tags?.filter((tag) => tag !== tagId),
              }
            : service
        )
      );

      toast({
        title: "Success",
        description: "Tag removed successfully",
      });
    } catch (error) {
      console.error("Failed to remove tag:", error);
      toast({
        title: "Error",
        description: "Failed to remove tag",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  // Map service tags to full tag objects
  const getServiceTags = (service: Service): Tag[] => {
    if (!service.tags || !Array.isArray(service.tags)) return [];
    return service.tags
      .map((tagId) => (typeof tagId === "string" ? tagsMap[tagId] : tagId))
      .filter((tag): tag is Tag => !!tag);
  };

  // In your component
  useEffect(() => {
    // Pass any required argument to fetchPermissions, e.g., currentUser or caseId if needed
    dispatch(fetchPermissions(currentUser?.id)); // Replace with the correct argument as per your fetchPermissions definition
  }, [dispatch, currentUser]);

  // Access permissions from Redux state
  const permissions = useSelector((state: RootState) => state.permissions);

  useEffect(() => {
    if (highlightServiceId) {
      setShowAll(true);
    }
  }, [highlightServiceId]);

  // const handleStatusChange = (serviceId: string, newStatus: string) => {
  //   const userStr = localStorage.getItem("user");
  //   const userObj = userStr ? JSON.parse(userStr) : {};

  //   setUpdatingServices((prev) => ({ ...prev, [serviceId]: true }));

  //   const updatedServices = localServices.map((service) => ({
  //     ...service,
  //     _id: service._id || service.id, // ensure _id exists!
  //   }));

  //   setLocalServices(updatedServices);

  //   // Calculate new overall status
  //   let newOverallStatus: CaseStatus = "New-Case";
  //   const allCompleted = updatedServices.every((s) => s.status === "Completed");
  //   const anyInProgressOrCompleted = updatedServices.some(
  //     (s) => s.status === "In-Progress" || s.status === "Completed"
  //   );

  //   if (allCompleted) {
  //     newOverallStatus = "Completed";
  //   } else if (anyInProgressOrCompleted) {
  //     newOverallStatus = "In-Progress";
  //   }

  //   // Calculate completion percentage
  //   const completedServices = updatedServices.filter(
  //     (s) => s.status === "Completed"
  //   ).length;
  //   const newCompletionPercentage = Math.round(
  //     (completedServices / updatedServices.length) * 100
  //   );

  //   const updatePayload = {
  //     id: caseId,
  //     services: updatedServices,
  //     overallCompletionPercentage: newCompletionPercentage,
  //     overallStatus: newOverallStatus,
  //     status: newOverallStatus, // This is where we set both status fields to the same value
  //     name: caseName || unitName || "",
  //     unitName: unitName || caseName || "",
  //     updatedAt: new Date().toISOString(),
  //     lastUpdate: new Date().toISOString(),
  //     readBy: [],
  //   };
  //   // console.log("Update Payload:", updatePayload);
  //   // Rest of your dispatch code remains the same...
  //   dispatch(updateCase(updatePayload))
  //     .unwrap()
  //     .then(async () => {
  //       toast({
  //         title: "Success",
  //         description: "Service status updated successfully.",
  //       });
  //       if (onUpdate) onUpdate();

  //       // --- Fetch assigned users ---
  //       let assignedUsers = [];
  //       let unitName = caseName || "";
  //       try {
  //         const caseRes =await axiosInstance.patch(`/cases/${caseId}/services/${serviceId}/status`, { status: newStatus });
  //         assignedUsers = caseRes.data.assignedUsers || [];
  //         unitName = caseRes.data.unitName || caseName || "";
  //       } catch (err) {
  //         // fallback: skip notification if fetching fails
  //         console.warn("Could not fetch assigned users for notification.", err);
  //       }

  //       // --- Prepare notification ---
  //       for (const user of assignedUsers) {
  //         if (user.userId === userObj._id) continue;
  //         try {
  //           await axiosInstance.post("/pushnotifications/send-notification", {
  //             userId: user._id,
  //             message: `Service "${
  //               localServices.find((s) => s.id === serviceId)?.name
  //             }" in case "${unitName}" was updated to "${newStatus}" by ${
  //               userObj.name
  //             }.`,
  //             icon: "https://tumbledry.sharda.co.in/favicon.png",
  //           });
  //         } catch (notifyErr) {
  //           console.error(
  //             `Error sending notification to ${user._id}:`,
  //             notifyErr
  //           );
  //         }
  //       }

  //       // --- Super Admin Notification ---
  //       const SUPER_ADMIN_ID = "68271c74487f3a8ea0dd6bdd";
  //       try {
  //         await axiosInstance.post("/pushnotifications/send-notification", {
  //           userId: SUPER_ADMIN_ID,
  //           message: `Service "${
  //             localServices.find((s) => s.id === serviceId)?.name
  //           }" in case "${unitName}" was updated to "${newStatus}" by ${
  //             userObj.name
  //           }.`,
  //           icon: "https://tumbledry.sharda.co.in/favicon.png",
  //         });
  //       } catch (superAdminErr) {
  //         console.error(
  //           "Error sending notification to Super Admin:",
  //           superAdminErr
  //         );
  //       }
  //     })

  //     .catch(() => {
  //       toast({
  //         title: "Error",
  //         description: "Failed to update service status.",
  //         variant: "destructive",
  //       });
  //       setLocalServices(services); // revert on failure
  //     })
  //     .finally(() => {
  //       setIsUpdating(false);
  //       setUpdatingServices((prev) => ({ ...prev, [serviceId]: false }));
  //     });
  // };

  // console.log(overallCompletionPercentage);


const handleStatusChange = async (serviceId: string, newStatus: string) => {
  setUpdatingServices((prev) => ({ ...prev, [serviceId]: true }));

  try {
    const userStr = localStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : {};

    // 1. Only call the PATCH API!
    const caseRes = await axiosInstance.patch(
      `/cases/${caseId}/services/${serviceId}/status`,
      { status: newStatus }
    );

    toast({
      title: "Success",
      description: "Service status updated successfully.",
    });

    // Update local state or refetch case here if you want
    if (onUpdate) onUpdate();

    // --- Fetch assigned users ---
    const assignedUsers = caseRes.data.assignedUsers || [];
    const unitName = caseRes.data.unitName || caseName || "";

    // --- Prepare notification ---
    for (const user of assignedUsers) {
      if (user.userId === userObj._id) continue;
      try {
        await axiosInstance.post("/pushnotifications/send-notification", {
          userId: user._id,
          message: `Service "${
            localServices.find((s) => s.id === serviceId)?.name
          }" in case "${unitName}" was updated to "${newStatus}" by ${
            userObj.name
          }.`,
          icon: "https://tumbledry.sharda.co.in/favicon.png",
        });
      } catch (notifyErr) {
        console.error(`Error sending notification to ${user._id}:`, notifyErr);
      }
    }

    // --- Super Admin Notification ---
    const SUPER_ADMIN_ID = "68271c74487f3a8ea0dd6bdd";
    try {
      await axiosInstance.post("/pushnotifications/send-notification", {
        userId: SUPER_ADMIN_ID,
        message: `Service "${
          localServices.find((s) => s.id === serviceId)?.name
        }" in case "${unitName}" was updated to "${newStatus}" by ${
          userObj.name
        }.`,
        icon: "https://tumbledry.sharda.co.in/favicon.png",
      });
    } catch (superAdminErr) {
      console.error("Error sending notification to Super Admin:", superAdminErr);
    }
  } catch (err) {
    toast({
      title: "Error",
      description: "Failed to update service status.",
      variant: "destructive",
    });
    setLocalServices(services); // revert on failure
  } finally {
    setIsUpdating(false);
    setUpdatingServices((prev) => ({ ...prev, [serviceId]: false }));
  }
};


  const visibleServices = showAll ? localServices : localServices.slice(0, 3);
  const displayCaseName = caseName || unitName || "Case Details";

  let progressValue = 0;

  if (overallStatus === "New-Case") {
    progressValue = 0;
  } else if (
    overallStatus === "In-Progress" &&
    (!overallCompletionPercentage || overallCompletionPercentage < 50)
  ) {
    progressValue = 50;
  } else {
    progressValue = overallCompletionPercentage;
  }

  const userRole = localStorage.getItem("userRole");
  // console.log("prrmissions", permissions);

  useEffect(() => {
    if (!highlightServiceId) return;

    // Delay scroll until next paint
    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        const element = serviceRefs.current[highlightServiceId];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // console.log(`✅ Scrolled to service ID: ${highlightServiceId}`);

          element.classList.add("animate-pulse", "bg-blue-50");
          setTimeout(() => {
            element.classList.remove("animate-pulse", "bg-blue-50");
          }, 3000);
        } else {
          console.warn(
            `⚠️ Element not found for service ID: ${highlightServiceId}`
          );
        }
      });
    }, 200); // Slight delay to allow any re-renders

    return () => clearTimeout(timeout);
  }, [highlightServiceId, localServices]);

  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  const canEdit = isAdmin || (permissions?.permissions?.edit ?? false);

  // console.log("isAdmin", isAdmin);
  // console.log("canEdit", canEdit);

  // console.log("userRole", userRole);

  return (
    <div>
      {/* Overall Progress Bar */}
      <div className="mb-6 p-4 border rounded-md bg-gray-50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{displayCaseName}</h3>
        </div>
        <Progress
          value={progressValue}
          aria-label={`Overall case completion ${progressValue}%`}
          className="h-3 rounded"
          style={
            {
              backgroundColor: ` "#00a4fc"}33`,
              "--indicator-color": "#00a4fc",
            } as React.CSSProperties
          }
          indicatorClassName="bg-[var(--indicator-color)]"
        />
        <p
          className="text-xs text-right mt-1 font-medium"
          style={{ color: "#02527d" }}
        >
          {progressValue.toFixed(2)}% Complete
        </p>
      </div>

      {/* Services List */}
      <ul className="space-y-4">
        {visibleServices.map((service) => {
          const serviceTags = getServiceTags(service);
          // Filter remarks belonging to this service and are unread
          const unreadRemarkCount = allRemarks.filter(
            (r) =>
              r.serviceId === service.id && !r.readBy?.includes(currentUser?.id)
          ).length;

          // console.log(
          //   `Service: ${service.name} (ID: ${service.serviceId}), Unread Remark Count: ${unreadRemarkCount}`
          // );

          return (
            <li
              id={`service-${service.serviceId}`}
              key={service.id}
              ref={(el) => {
                if (el) serviceRefs.current[service.id] = el;
              }}
              className={`p-3 border rounded-lg shadow-xs bg-card hover:shadow-md transition-shadow ${
                highlightServiceId === service.id ? "ring-2 ring-blue-500" : ""
              } w-full`}
            >
              {/* Responsive row: stack on mobile, row on desktop */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-2 w-full">
                <div className="flex flex-col xs:flex-row sm-flex-row xs:items-center gap-y-1 gap-x-2 flex-wrap w-full min-w-0">
                  <h4 className="font-semibold text-md break-words">
                    {service.name}
                    {unreadRemarkCount > 0 && userRole && (
                      <span className="inline-flex items-center bg-blue-500 text-white p-1 px-2 text-xs border rounded-full ">
                        {unreadRemarkCount} unread remark
                        {unreadRemarkCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </h4>
                  {/* Render tags */}
                  <div className="flex gap-1 flex-wrap overflow-x-auto max-w-full">
                    {showTags &&
                      serviceTags.map((tag) => (
                        <span
                          key={tag._id}
                          className="inline-flex items-center mr-2 mb-2 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200"
                          style={{
                            backgroundColor: tag.color,
                            color: "#fff",
                            paddingRight: "0.5rem",
                          }}
                        >
                          {tag.name}

                          {(currentUser?.role === "Admin" ||
                            currentUser?.role === "User") && (
                            <button
                              type="button"
                              disabled={isRemoving === tag._id}
                              className="ml-1 -mr-0.5 flex-shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/50 disabled:opacity-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(service.id, tag._id);
                              }}
                              aria-label={`Remove ${tag.name} tag`}
                            >
                              {isRemoving === tag._id ? (
                                <Spinner className="h-2.5 w-2.5" />
                              ) : (
                                <svg
                                  className="h-2.5 w-2.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
                        </span>
                      ))}
                  </div>
                  {/* Show badge only if unread remarks exist */}
                </div>

                <div className="w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                  <select
                    value={service.status}
                    onChange={(e) => {
                      if (canEdit) {
                        handleStatusChange(service.id, e.target.value);
                      } else {
                        toast({
                          title: "Permission Denied",
                          description:
                            "You are a Viewer and cannot change the service status.",
                          variant: "destructive",
                        });
                        e.target.value = service.status;
                      }
                    }}
                    className={`block w-full sm:w-auto cursor-pointer rounded-2xl px-3 py-2 font-semibold border text-sm ${
                      statusStyles[service.status] ||
                      "bg-blue-100 text-blue-800 border-gray-300 text-xs"
                    }`}
                  >
                    {Object.values(SERVICE_STATUS).map((statusOption) => (
                      <option
                        key={statusOption}
                        value={statusOption}
                        className={`${
                          statusStyles[statusOption] || "bg-white text-black"
                        }`}
                      >
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Remarks Section */}
              <div className="flex xs:flex-row xs:items-center gap-2 mt-2">
                <ServiceRemarks
                  highlightRemarkId={
                    highlightServiceId === service.id
                      ? highlightRemarkId
                      : undefined
                  }
                  caseId={caseId}
                  caseName={unitName || caseName || "Case"}
                  serviceId={service.id}
                  currentUser={currentUser}
                  serviceName={service.name}
                  onRemarkRead={onRemarkRead}
                />
                {(currentUser?.role === "Admin" ||
                  currentUser?.role === "User") &&
                  showTags && (
                    <button
                      className="ml-0 xs:ml-2 mt-1 xs:mt-0 p-1.5 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                      onClick={() => {
                        setSelectedServiceForTags(service.id);
                        setExistingTags(
                          (service.tags || [])
                            .map((id) => tagsMap[id])
                            .filter((t): t is Tag => !!t) // remove undefined
                        );
                        setTagModalOpen(true);
                      }}
                      title="Manage Tags"
                      aria-label="Manage Tags"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
              </div>

              {/* Tag Modal - place outside flex for best UX */}

              <ServiceTagsModal
                open={tagModalOpen}
                onClose={() => setTagModalOpen(false)}
                caseId={caseId}
                serviceId={selectedServiceForTags ?? ""}
                existingTags={existingTags}
                onTagsUpdated={(updatedTags) => {
                  setLocalServices((prev) =>
                    prev.map((s) =>
                      s.id === (selectedServiceForTags ?? "")
                        ? { ...s, tags: updatedTags.map((tag) => tag._id) }
                        : s
                    )
                  );
                }}
                currentUser={currentUser}
              />
            </li>
          );
        })}
      </ul>

      {/* Show More / Less Button */}
      {localServices.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 px-4 py-2 text-primary border border-primary rounded hover:bg-primary hover:text-white transition"
        >
          {showAll ? "View Less Services" : "View More Services"}
        </button>
      )}
    </div>
  );
};

export default CaseServices;

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
