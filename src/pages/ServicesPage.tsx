import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { getCases, updateCase } from "@/features/caseSlice";
import { flattenServices } from "@/utils/flattenServices";
import ServiceTable from "@/components/Services/ServiceTable";
import ServiceCardView from "@/components/Services/ServiceCardView";
import PageHeader from "@/components/ui/page-header";
import type { Case, User } from "@/types/franchise";
import { fetchPermissions } from "@/features/permissionsSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@radix-ui/react-tooltip";
import {
  List,
  LayoutGrid,
  Filter,
  ListFilter,
  CheckCircle,
  ChevronDown,
  FilterIcon,
  PlusCircle,
  ServerIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import axiosInstance from "@/utils/axiosInstance";

type ViewMode = "table" | "card";

function mapServiceStatus(status: string) {
  if (status === "New-Case") return "To be Started";
  return status;
}

export default function ServicesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { cases: allCases, loading } = useSelector(
    (state: RootState) => state.case
  );

  const [allServices, setAllServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceSearch, setServiceSearch] = useState<string>("");
  const [statusSearch, setStatusSearch] = useState<string>("");
  // Add these state variables
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedServiceForTags, setSelectedServiceForTags] = useState<
    string | null
  >(null);

  const { permissions } = useSelector((state: RootState) => state.permissions);

  const hasAllCaseAccess =
    currentUser?.name === "Super Admin" || permissions?.allCaseAccess === true;

  const uniqueServiceNames = Array.from(
    new Set(allServices.map((s) => s.name).filter(Boolean))
  );
  const uniqueStatuses = Array.from(
    new Set(allServices.map((s) => s.status).filter(Boolean))
  );

  useEffect(() => {
    let filtered = allServices;
    if (serviceFilter !== "all") {
      filtered = filtered.filter((service) => service.name === serviceFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((service) => service.status === statusFilter);
    }
    if (activeFilter !== "all") {
      filtered = filtered.filter((service) => service.status === activeFilter);
    }
    setFilteredServices(filtered);
  }, [allServices, serviceFilter, statusFilter, activeFilter]);

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

  // Remove the function at the bottom:

  useEffect(() => {
    if (allCases.length === 0) {
      dispatch(getCases());
    }
  }, [dispatch]);

  // useEffect(() => {
  //   setAllServices(flattenServices(allCases || []));
  // }, [allCases]);

  useEffect(() => {
    if (allCases?.length) {
      // console.log("Loaded cases", allCases);
    }
  }, [allCases]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let filtered = allServices;

      if (serviceFilter !== "all") {
        filtered = filtered.filter((s) => s.name === serviceFilter);
      }
      if (statusFilter !== "all") {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }

      setFilteredServices(filtered);
    }, 200); // Debounce

    return () => clearTimeout(timeout);
  }, [allServices, serviceFilter, statusFilter]);

  const handleDelete = (service: any) => {
    if (window.confirm(`Delete service "${service.name}"?`)) {
      // Implement API call here
      alert("Service deleted (implement API call here)");
    }
  };

  const SUPER_ADMIN_ID = "68271c74487f3a8ea0dd6bdd";

  // const handleStatusChange = async (serviceId: string, newStatus: string) => {
  //   // Find the service and its parent case
  //   const service = allServices.find((s) => s.id === serviceId);
  //   if (!service) return;
  //   const caseId = service.parentCase?._id;
  //   if (!caseId) return;

  //   // Prepare updated services array for the case
  //   const parentCase = allCases.find((c: any) => c._id === caseId);
  //   if (!parentCase) return;

  //   const updatedServices = (parentCase.services ?? []).map((s: any) =>
  //     s.id === serviceId ? { ...s, status: newStatus } : s
  //   );

  //   // Dispatch updateCase (or your update service API)
  //   await dispatch(
  //     updateCase({
  //       ...parentCase,
  //       services: updatedServices,
  //     })
  //   );
  //   // Optionally, refresh cases after update
  //   dispatch(getCases());

  //   // --- PUSH NOTIFICATION LOGIC BELOW ---
  //   try {
  //     const userStr = localStorage.getItem("user");
  //     const userObj = userStr ? JSON.parse(userStr) : {};
  //     const caseName = parentCase.unitName || parentCase.name || "Case";
  //     const assignedUsers = parentCase.assignedUsers || [];

  //     // Send notification to all assigned users except the one making the change
  //     for (const user of assignedUsers) {
  //       const userId = typeof user === "string" ? user : user._id;
  //       console.log("userid :", userId);
  //       if (!userId) continue; // skip if undefined/null
  //       if (userId === userObj._id) continue; // Skip self
  //       try {
  //         // await fetch(
  //         //   "https://tumbledrybe.sharda.co.in/api/pushnotifications/send-notification",
  //         //   {
  //         //     method: "POST",
  //         //     headers: { "Content-Type": "application/json" },
  //         //     body: JSON.stringify({
  //         //       userId: userId,
  //         //       message: `Service "${service.name}" in case "${caseName}" status updated to "${newStatus}" by ${userObj.name}.`,
  //         //       icon: "https://tumbledry.sharda.co.in/favicon.png", // Optional icon
  //         //     }),
  //         //   }
  //         // );

  //         await axiosInstance.post("/pushnotifications/send-notification", {
  //           userId: userId,
  //           message: `Service "${service.name}" in case "${caseName}" status updated to "${newStatus}" by ${userObj.name}.`,
  //           icon: "https://tumbledry.sharda.co.in/favicon.png",
  //         });
  //       } catch (err) {
  //         console.error(`Error sending notification to user ${userId}:`, err);
  //       }
  //     }

  //     // Optionally: Notify Super Admin
  //     try {
  //       await axiosInstance.post("/pushnotifications/send-notification", {
  //         userId: SUPER_ADMIN_ID,
  //         message: `Service "${service.name}" in case "${caseName}" status updated to "${newStatus}" by ${userObj.name}.`,
  //         icon: "https://tumbledry.sharda.co.in/favicon.png",
  //       });
  //     } catch (err) {
  //       console.error("Error sending notification to Super Admin:", err);
  //     }
  //   } catch (err) {
  //     console.error("Error in notification logic:", err);
  //   }
  // };


  const handleStatusChange = async (serviceId: string, newStatus: string) => {
  // 1. Find the service and its parent case
  const service = allServices.find((s) => s.id === serviceId || s._id === serviceId);
  if (!service) return;
  const caseId = service.parentCase?._id || service.parentCase?.id;
  if (!caseId) return;

  // 2. Call the PATCH endpoint (new API)
  try {
    const response = await axiosInstance.patch(
      `/cases/${caseId}/services/${serviceId}/status`,
      { status: newStatus }
    );
    // Optionally, get the updated service (the new status) from the API response
    const updatedCase = response.data.case;
    const updatedService = updatedCase?.services?.find(
      (s: { _id: string; id: string; }) => s._id === serviceId || s.id === serviceId
    );

    // 3. Update only the changed service in allServices
    if (updatedService) {
      setAllServices((prev) =>
        prev.map((s) =>
          (s.id === serviceId || s._id === serviceId)
            ? { ...s, ...updatedService }
            : s
        )
      );
    } else {
      // fallback: update status only
      setAllServices((prev) =>
        prev.map((s) =>
          (s.id === serviceId || s._id === serviceId)
            ? { ...s, status: newStatus }
            : s
        )
      );
    }

    // --- PUSH NOTIFICATION LOGIC (same as before, optional) ---
    const userStr = localStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : {};
    const caseName = service.parentCase?.unitName || service.parentCase?.name || "Case";
    const assignedUsers = service.parentCase?.assignedUsers || [];

    for (const user of assignedUsers) {
      const userId = typeof user === "string" ? user : user._id;
      if (!userId || userId === userObj._id) continue;
      try {
        await axiosInstance.post("/pushnotifications/send-notification", {
          userId,
          message: `Service "${service.name}" in case "${caseName}" status updated to "${newStatus}" by ${userObj.name}.`,
          icon: "https://tumbledry.sharda.co.in/favicon.png",
        });
      } catch (err) {
        console.error(`Error sending notification to user ${userId}:`, err);
      }
    }
    // Notify Super Admin
    try {
      await axiosInstance.post("/pushnotifications/send-notification", {
        userId: SUPER_ADMIN_ID,
        message: `Service "${service.name}" in case "${caseName}" status updated to "${newStatus}" by ${userObj.name}.`,
        icon: "https://tumbledry.sharda.co.in/favicon.png",
      });
    } catch (err) {
      console.error("Error sending notification to Super Admin:", err);
    }
    // --- END NOTIFICATION ---

  } catch (err) {
    alert("Failed to update service status!");
    // (Optional: revert status or show error)
  }
};


  useEffect(() => {
    const servicesWithEditTime: any[] = [];

    allCases?.forEach((parentCase: any) => {
      if (!Array.isArray(parentCase.services)) return; // Avoid crashing on undefined

      const lastEdited = parentCase.lastEditedService || {};

      parentCase.services.forEach((service: any) => {
        if (!service.id) return; // skip invalid service

        servicesWithEditTime.push({
          ...service,
          status:
            service.status === "New-Case" ? "To be Started" : service.status,
          parentCase,
          editedAt: service.id === lastEdited.id ? lastEdited.editedAt : null,
        });
      });
    });

    const limitedServices = servicesWithEditTime.slice(0, 1000);
    const getTimeSafe = (date: any) => {
      const t = new Date(date).getTime();
      return isNaN(t) ? 0 : t;
    };

    const sortedServices = limitedServices.sort((a, b) => {
      return getTimeSafe(b.editedAt) - getTimeSafe(a.editedAt);
    });

    setAllServices(sortedServices);
  }, [allCases]);

  useEffect(() => {
    if (!currentUser || !Array.isArray(allCases)) return;

    const hasAllCaseAccess =
      currentUser?.name === "Super Admin" ||
      permissions?.allCaseAccess === true;

    // Pick relevant cases
    const visibleCases = hasAllCaseAccess
      ? allCases
      : allCases.filter((c: any) =>
          c.assignedUsers?.some((user: any) => {
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

    // Flatten services from the selected cases
    const servicesWithEditTime: any[] = [];

    visibleCases.forEach((parentCase: any) => {
      if (!Array.isArray(parentCase.services)) return;

      const lastEdited = parentCase.lastEditedService || {};

      parentCase.services.forEach((service: any) => {
        if (!service.id) return;

        servicesWithEditTime.push({
          ...service,
          status:
            service.status === "New-Case" ? "To be Started" : service.status,
          parentCase,
          editedAt: service.id === lastEdited.id ? lastEdited.editedAt : null,
        });
      });
    });

    // Limit, sort, and set state
    const limitedServices = servicesWithEditTime.slice(0, 1000);
    const getTimeSafe = (date: any) => {
      const t = new Date(date).getTime();
      return isNaN(t) ? 0 : t;
    };

    const sortedServices = limitedServices.sort((a, b) => {
      return getTimeSafe(b.editedAt) - getTimeSafe(a.editedAt);
    });

    setAllServices(sortedServices);
  }, [allCases, currentUser, permissions]);

  // Add these handlers
  const handleViewRemarks = (service: any) => {
    setSelectedServiceId(service.id);
    setSelectedCaseId(service.parentCase?._id);
  };

  const handleAddRemark = (service: any) => {
    setSelectedServiceId(service.id);
    setSelectedCaseId(service.parentCase?._id);
  };

  const handleEditTags = (service: any) => {
    setSelectedServiceForTags(service.id);
    setSelectedCaseId(service.parentCase?._id);
  };

  const caseId =
    filteredServices.length > 0 ? filteredServices[0].parentCase?._id : null;

  console.log("case ID : ", caseId);



  return (
    <>
      <PageHeader
        title="All Services"
        description="View and manage all services across cases."
      >
        <div className="flex gap-2 items-center justify-center">
          <div className="flex items-center gap-2 ml-auto">
            <TooltipProvider>
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
              {/* On mobile, show only Card view icon, but disabled */}
              <div className="block sm:hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" disabled>
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Card View</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          <div className="flex gap-3 items-center">
            {/* Service Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 rounded-md border-2 border-gray-300 hover:border-blue-500 transition-all !important"
                >
                  <ServerIcon className="h-4 w-4" />
                  {serviceFilter === "all" ? "All Services" : serviceFilter}
                  <ChevronDown className="ml-auto h-4 w-4 opacity-50 !important" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-w-[95vw] max-h-[500px] overflow-y-auto  right-0 bg-white p-4 flex flex-col gap-3 shadow-lg rounded-md border border-gray-200 !important"
              >
                <DropdownMenuLabel className="text-sm font-medium text-gray-700 !important">
                  Filter by Service
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2 border-t border-gray-300 !important" />
                <div className="p-2">
                  <Input
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="h-8 text-sm px-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 !important"
                  />
                </div>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => setServiceFilter("all")}
                    className={cn(
                      serviceFilter === "all" &&
                        "bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 transition-all !important"
                    )}
                  >
                    All Services
                  </DropdownMenuItem>
                  {uniqueServiceNames
                    .filter((name) =>
                      name.toLowerCase().includes(serviceSearch.toLowerCase())
                    )
                    .map((name) => (
                      <DropdownMenuItem
                        key={name}
                        onSelect={() => setServiceFilter(name)}
                        className={cn(
                          serviceFilter === name &&
                            "bg-accent text-white hover:bg-blue-200 transition-all !important"
                        )}
                      >
                        {name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" />
                  {statusFilter === "all" ? "All Statuses" : statusFilter}
                  <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[240px] bg-white p-4 flex flex-col gap-2 shadow-lg rounded-md"
              >
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Input
                    placeholder="Search statuses..."
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => setStatusFilter("all")}
                    className={cn(
                      statusFilter === "all" && "bg-accent hover:bg-blue-200"
                    )}
                  >
                    All Statuses
                  </DropdownMenuItem>
                  {uniqueStatuses
                    .filter((status) =>
                      status.toLowerCase().includes(statusSearch.toLowerCase())
                    )
                    .map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onSelect={() => setStatusFilter(status)}
                        className={cn(
                          statusFilter === status &&
                            "bg-accent hover:bg-blue-200"
                        )}
                      >
                        {status}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </PageHeader>

      {filteredServices.length === 0 ? (
        <div className="text-center p-6 sm:p-10 text-gray-500 text-sm sm:text-base">
          No services found for this filter.
        </div>
      ) : (
        // On mobile, always show CardView. On desktop, allow switching.
        <div>
          {/* Mobile: Always CardView */}
          <div className="block sm:hidden">
            <ServiceCardView
              services={filteredServices}
              onDelete={handleDelete}
              onViewRemarks={handleViewRemarks}
              onAddRemark={handleAddRemark}
              onStatusChange={handleStatusChange}
              currentUser={currentUser}
              onRemarkRead={(serviceId, userId) => {
                // Handle remark read logic here
                console.log(
                  `User ${userId} read remarks for service ${serviceId}`
                );
              }}
            />
          </div>
          {/* Desktop: Table or CardView based on viewMode */}
          <div className="hidden sm:block">
            {viewMode === "table" ? (
              <ServiceTable
                services={filteredServices}
                onDelete={handleDelete}
                onViewRemarks={handleViewRemarks}
                onAddRemark={handleAddRemark}
                onStatusChange={handleStatusChange}
                currentUser={currentUser}
                onRemarkRead={(serviceId, userId) => {
                  // Handle remark read logic here
                  console.log(
                    `User ${userId} read remarks for service ${serviceId}`
                  );
                }}
              />
            ) : (
              <ServiceCardView
                services={filteredServices}
                onDelete={handleDelete}
                onViewRemarks={handleViewRemarks}
                onAddRemark={handleAddRemark}
                onStatusChange={handleStatusChange}
                currentUser={currentUser}
                onRemarkRead={(serviceId, userId) => {
                  // Handle remark read logic here
                  console.log(
                    `User ${userId} read remarks for service ${serviceId}`
                  );
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
function getPaginatedServices(arg0: { limit: number; offset: number }): any {
  throw new Error("Function not implemented.");
}
