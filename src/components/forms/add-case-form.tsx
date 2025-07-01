"use client"; // Not strictly needed in Vite
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MOCK_SERVICES_TEMPLATES, MOCK_USERS } from "@/lib/constants";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectReact from "react-select";
import { updateCase, addCase } from "@/features/caseSlice"; // Import your thunks
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { useAppSelector } from "@/hooks/hooks";
import CreatableSelect from "react-select/creatable";
import { Controller } from "react-hook-form";
import { getAllUsers } from "@/features/userSlice"; // adjust path if needed
// import { AddServiceDialog } from "../ui/AddServiceDialog";
import type { ServiceStatus } from "@/types/franchise"; // <-- Adjust the import path as needed
import axiosInstance from "@/utils/axiosInstance";

const allowedStatuses = [
  "New-Case",
  "In-Progress",
  "Completed",
  "Rejected",
] as const;

const caseFormSchema = z.object({
  srNo: z.string().min(1, "SR. No. is required"),
  ownerName: z.string().min(2, "Owner's name must be at least 2 characters."),
  clientName: z.string().min(2, "Client name must be at least 2 characters."),
  unitName: z.string().min(2, "Unit name must be at least 2 characters."),
  franchiseAddress: z.string().min(5, "Franchise address is required."),
  stateHead: z.string().optional(),
  authorizedPerson: z.string().min(2, "Authorized Person's name is required."), // Make this required
  services: z
    .array(
      z.object({
        name: z.string(),
        selected: z.boolean(),
        status: z.string().optional(),
        remarks: z.array(z.string()).optional(), // <-- array, not string!
        completionPercentage: z.number().optional(),
        tags: z.array(z.string()).optional(), // <-- add this!
        id: z.string().optional(),
        _id: z.string().optional(),
        serviceId: z.string().optional(),
      })
    )
    .refine((value) => value.some((service) => service.selected), {
      message: "You must select at least one service.",
    }),
  assignedUsers: z.array(z.string()).optional(),
  status: z.enum(allowedStatuses, {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
  reasonForStatus: z.string().optional(),
});

type Service = {
  name: string;
  selected: boolean;
  status?: string;
  remarks?: string[]; // <-- array
  completionPercentage?: number;
  tags?: string[]; // <-- array
  id?: string;
  _id?: string;
  serviceId?: string;
};

type CaseFormValues = z.infer<typeof caseFormSchema>;

const defaultServices = MOCK_SERVICES_TEMPLATES.map((service) => ({
  name: service.name,
  selected: false,
  status: "To-be-Started",
  remarks: [],
  completionPercentage: 0,
  tags: [],
  id: "", // or generate a string if needed
  _id: "", // or generate a string if needed
  serviceId: "", // or generate a string if needed
}));

export default function AddCaseForm() {
  const [globalServices, setGlobalServices] = useState<{ name: string }[]>([]);
  const { caseId } = useParams();
  const isEditing = !!caseId;
  const [loadingEdit, setLoadingEdit] = useState(false);
  // Change these state declarations
  const [ownerOptions, setOwnerOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [clientOptions, setClientOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // For debounce search

  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { users } = useAppSelector((state) => state.users);
  // console.log("Loaded users:", users);
  const FORM_STORAGE_KEY = "add_case_form_data";

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      srNo: "",
      ownerName: "",
      clientName: "", // new client field
      unitName: "",
      franchiseAddress: "",
      stateHead: "",
      authorizedPerson: "",
      services: defaultServices,
      assignedUsers: [],
      reasonForStatus: "",
      status: "New-Case",
    },
  });

  useEffect(() => {
    const wasPageReloaded =
      (
        performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined
      )?.type === "reload" || window.performance?.navigation?.type === 1; // fallback for older browsers

    if (wasPageReloaded) {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm);
          form.reset(parsed);
        } catch (err) {
          console.warn("Failed to parse saved form data", err);
        }
      }
    } else {
      // ⚠️ If not a reload, clear storage to avoid auto-fill
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(value));
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axiosInstance.get("/services");
        setGlobalServices(res.data);

        // Only reset services if not editing
        if (!isEditing) {
          form.reset({
            ...form.getValues(),
            services: res.data.map((service: any) => ({
              name: service.name,
              selected: false,
            })),
          });
        } else {
          // If editing, update the services with newly added ones.
          const existingServices = form.getValues("services");
          const combinedServices = [
            ...existingServices,
            ...res.data.map((service: any) => ({
              name: service.name,
              selected: false,
            })),
          ];

          // Update form values with the combined services list
          form.reset({
            ...form.getValues(),
            services: combinedServices,
          });
        }
      } catch (e) {
        console.error("Failed to fetch services", e);
        toast({
          title: "Error",
          description: "Failed to load services",
          variant: "destructive",
        });
      }
    };

    fetchServices();
  }, [isEditing]);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    const fetchCase = async () => {
      if (!isEditing) return;

      setLoadingEdit(true);
      try {
        const [caseRes, serviceRes] = await Promise.all([
          axiosInstance.get(`/cases/${caseId}`),
          axiosInstance.get(`/services`),
        ]);

        const caseData = caseRes.data;
        const liveServices = serviceRes.data;

        // Keep only unique services (avoid duplicates)
        const uniqueServiceNames = new Set<string>();
        const finalServiceList: {
          name: string;
          selected: boolean;
          status?: string;
          remarks?: string[]; // Correct type!
          completionPercentage?: number;
          tags?: string[];
          id?: string;
          _id?: string;
          serviceId?: string;
        }[] = [];

        // First, add all selected services from case (even if deleted in DB)
        for (const s of caseData.services || []) {
          if (!uniqueServiceNames.has(s.name)) {
            finalServiceList.push({
              name: s.name,
              selected: true,
              status: s.status || "To-be-Started",
              remarks: s.remarks || [],
              completionPercentage: s.completionPercentage || 0,
            });

            uniqueServiceNames.add(s.name);
          }
        }

        // Then, add new (unselected) services from live DB
        for (const s of liveServices || []) {
          if (!uniqueServiceNames.has(s.name)) {
            finalServiceList.push({
              name: s.name,
              selected: false,
              status: s.status || "To-be-Started",
              remarks: s.remarks || [],
              completionPercentage: s.completionPercentage || 0,
            });

            uniqueServiceNames.add(s.name);
          }
        }

        const assignedUserIds =
          caseData.assignedUsers?.map((u: any) =>
            typeof u === "string" ? u : u._id
          ) || [];

        form.reset({
          srNo: caseData.srNo,
          ownerName: caseData.ownerName,
          clientName: caseData.clientName,
          unitName: caseData.unitName,
          franchiseAddress: caseData.franchiseAddress,
          stateHead: Array.isArray(caseData.stateHead)
            ? caseData.stateHead.join(", ")
            : caseData.stateHead || "",
          authorizedPerson: caseData.authorizedPerson,
          assignedUsers: assignedUserIds,
          reasonForStatus: caseData.reasonForStatus,
          services: finalServiceList,
          status: caseData.status || "New-Case",
        });
      } catch (err) {
        console.error("Failed to load case:", err);
      } finally {
        setLoadingEdit(false);
      }
    };

    fetchCase();
  }, [caseId, isEditing, form]);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await axiosInstance.get("/owners");
        setOwnerOptions(
          res.data.map((o: any) => ({
            label: o.name,
            value: o.name,
          }))
        );
      } catch (e) {
        console.error("Failed to fetch owners", e);
      }
    };

    fetchOwners();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axiosInstance.get("/clients");
        setClientOptions(
          res.data.map((c: any) => ({
            label: c.name,
            value: c.name,
          }))
        );
      } catch (e) {
        console.error("Failed to fetch clients", e);
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive",
        });
      }
    };
    fetchClients();
  }, []);

  // Create Owner if not exists
  const createOwner = async (name: string) => {
    try {
      const res = await axiosInstance.post("/owners", {
        name,
      });
      const newOption = { label: name, value: name }; // Create proper option object
      setOwnerOptions((prev) => [...prev, newOption]); // Add the complete option
      return name; // Return the name for consistency
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to create owner",
        variant: "destructive",
      });
      return null;
    }
  };
  // Create Client if not exists
  const createClient = async (name: string) => {
    console.log("Attempting to create client:", name);
    try {
      const res = await axiosInstance.post("/clients", {
        name,
      });
      console.log("Client creation response:", res.data);
      const newOption = { label: name, value: name };
      setClientOptions((prev) => [...prev, newOption]);
      return name;
    } catch (err) {
      let errorMessage = "Unknown error";
      if (typeof err === "object" && err !== null) {
        if (
          "response" in err &&
          typeof (err as any).response === "object" &&
          (err as any).response !== null
        ) {
          errorMessage =
            (err as any).response.data?.message ||
            (err as any).message ||
            "Unknown error";
        } else if ("message" in err) {
          errorMessage = (err as any).message;
        }
      }
      console.error("Client creation error:", errorMessage);
      toast({
        title: "Error",
        description: "Failed to create client: " + errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const onSubmit = async (data: CaseFormValues) => {
    try {
       console.log("Form data before processing:", data); // Debug log

   
      // Step 1: Handle owner creation if needed
      if (!ownerOptions.some((opt) => opt.value === data.ownerName)) {
        const createdOwner = await createOwner(data.ownerName);
        if (!createdOwner) {
          throw new Error("Failed to create owner.");
        }
        // After creating, add to options if not already there
        if (!ownerOptions.some((opt) => opt.value === createdOwner)) {
          setOwnerOptions((prev) => [
            ...prev,
            { label: createdOwner, value: createdOwner },
          ]);
        }
      }

      // Step 2: Handle client creation if needed
      if (!clientOptions.some((opt) => opt.value === data.clientName)) {
        const createdClient = await createClient(data.clientName);
        if (!createdClient) throw new Error("Failed to create client.");
      }

      // Step 3: Get original case data if editing
      const originalCase = isEditing
        ? await axiosInstance.get(`/cases/${caseId}`).then((res) => res.data)
        : null;
      // Step 4: Prepare new service details
      const newCaseServices = data.services
        .filter((s) => s.selected)
        .map((s, index) => {
          let tags = [];
          let oldService = null;

          if (isEditing && originalCase) {
            // Find by id, serviceId, or name
            oldService = originalCase.services.find(
              (os: Service) =>
                (os.id && s.id && os.id === s.id) ||
                (os.serviceId && s.serviceId && os.serviceId === s.serviceId) ||
                os.name === s.name
            );
            if (oldService && oldService.tags) tags = oldService.tags;
          }

          // Use old id/serviceId if present!
          return {
            _id: oldService?._id || s._id || `service-${index}-${Date.now()}`,
            id: oldService?.id || s.id || `service-${index}-${Date.now()}`,
            serviceId:
              oldService?.serviceId ||
              s.serviceId ||
              s.id ||
              `service-${index}-${Date.now()}`,
            name: s.name,
            status: s.status || "To-be-Started",
            remarks: s.remarks || [],
            completionPercentage: s.completionPercentage ?? 0,
            tags: s.tags || tags,
          };
        });

      // Step 5: Delete remarks for deselected services (only when editing)
      if (isEditing && originalCase) {
        const deselectedServices = originalCase.services.filter(
          (originalService: any) =>
            !data.services.some(
              (newService) =>
                newService.selected &&
                (newService.id === originalService.id ||
                  newService.name === originalService.name)
            )
        );

        // Delete remarks for each deselected service
        for (const service of deselectedServices) {
          try {
            await axiosInstance.delete(`https://tumbledrybe.sharda.co.in/api/remarks`, {
              data: {
                caseId: caseId,
                serviceId: service.serviceId || service.id,
              },
            });
          } catch (err) {
            console.error(
              `Failed to delete remarks for service ${service.name}:`,
              err
            );
            // Continue with submission even if remark deletion fails
          }
        }
      }

      // Step 6: Prepare assigned users with additional users
      const additionalUserNames = [
        data.authorizedPerson,
        data.stateHead,
      ].filter(Boolean);

      const additionalUserIds = additionalUserNames
        .map((name) => users.find((u) => u.name === name)?._id)
        .filter((id): id is string => !!id);

      const combinedAssignedUserIds = Array.from(
        new Set([...(data.assignedUsers || []), ...additionalUserIds])
      );

      // Step 7: Prepare the case payload
      const casePayload = {
        name: data.unitName,
        srNo: data.srNo,
        ownerName: data.ownerName,
        clientName: data.clientName,
        unitName: data.unitName,
        franchiseAddress: data.franchiseAddress,
        stateHead: data.stateHead || "",
        authorizedPerson: data.authorizedPerson || "",
        services: newCaseServices,
        assignedUsers: combinedAssignedUserIds.map((userId) => {
          const user = users.find((u) => u._id === userId);
          if (!user) {
            console.warn(`User with ID ${userId} not found`);
            return {
              _id: userId,
              userId: "",
              name: "Unknown User",
            };
          }
          return {
            _id: user._id,
            userId: user.userId || "",
            name: user.name,
          };
        }),
        reasonForStatus: data.reasonForStatus,
        status: data.status as any,
        overallStatus:
          data.status === "In-Progress" ? "In-Progress" : (data.status as any),
        lastUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        overallCompletionPercentage: 0,
        readBy: [],
      };
  console.log("Final payload being sent:", casePayload); // Debug log
      // Step 8: Handle case creation/update
      if (isEditing) {
        const result = await dispatch(
          updateCase({ ...casePayload, id: caseId })
        );

        if (updateCase.fulfilled.match(result)) {
          // Notification logic
          const userStr = localStorage.getItem("user");
          const userObj = userStr ? JSON.parse(userStr) : {};

          // Notify assigned users
          for (const user of casePayload.assignedUsers) {
            if (user.userId === userObj._id) continue;
            try {
              await axiosInstance.post("/pushnotifications/send-notification", {
                userId: user._id,
                message: `Case "${casePayload.unitName}" was updated by ${userObj.name}.`,
                icon: "https://tumbledry.sharda.co.in/favicon.png",
              });
            } catch (notifyErr) {
              console.error(
                `Error sending notification to ${user._id}:`,
                notifyErr
              );
            }
          }

          // Notify Super Admin
          const SUPER_ADMIN_ID = "68271c74487f3a8ea0dd6bdd";
          try {
            await axiosInstance.post("/pushnotifications/send-notification", {
              userId: SUPER_ADMIN_ID,
              message: `Case "${casePayload.unitName}" was updated by ${userObj.name}.`,
              icon: "https://tumbledry.sharda.co.in/favicon.png",
            });
          } catch (superAdminErr) {
            console.error(
              "Error sending notification to Super Admin:",
              superAdminErr
            );
          }

          toast({
            title: "Case Updated!",
            description: "Changes saved successfully.",
          });
          navigate(`/cases/${caseId}`);
        }
      } else {
        const result = await dispatch(addCase(casePayload));
        if (addCase.fulfilled.match(result)) {
          toast({
            title: "Case Created!",
            description: `${data.unitName} was added.`,
          });
          navigate(`/cases/${result.payload._id || result.payload.id}`);
        } else {
          throw new Error(
            typeof result.payload === "string"
              ? result.payload
              : JSON.stringify(result.payload) || "Failed to add case"
          );
        }
      }

      localStorage.removeItem(FORM_STORAGE_KEY);
      navigate("/cases");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Submission failed",
          variant: "destructive",
        });
      }
    }
  };

  const authorizedPersons = users.filter(
    (user) => String(user.role) === "Authorized Person"
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Franchise & Owner Details</CardTitle>
              <CardDescription>
                Provide the basic information about the franchise unit and its
                owner.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
                {/* SR No */}
                <FormField
                  control={form.control}
                  name="srNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SR. No.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Name */}
                <FormField
                  control={form.control}
                  name="unitName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Name / Project Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., M/s Tumbledry Hub"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Owner Name */}
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner's Name</FormLabel>
                      <FormControl>
                        <Controller
                          control={form.control}
                          name="ownerName"
                          render={({ field: { onChange, value, ref } }) => (
                            <CreatableSelect
                              isClearable
                              isSearchable
                              options={ownerOptions}
                              onChange={(selectedOption) =>
                                onChange(
                                  selectedOption ? selectedOption.value : ""
                                )
                              }
                              value={
                                value
                                  ? ownerOptions.find(
                                      (opt) => opt.value === value
                                    ) || {
                                      label: value,
                                      value: value,
                                    }
                                  : null
                              }
                              placeholder="Select or create owner..."
                              ref={ref}
                              classNamePrefix="react-select"
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client Name */}
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client's Name</FormLabel>
                      <FormControl>
                        <Controller
                          control={form.control}
                          name="clientName"
                          render={({ field: { onChange, value, ref } }) => (
                            <CreatableSelect
                              isClearable
                              isSearchable
                              options={clientOptions}
                              onChange={(selectedOption) =>
                                onChange(
                                  selectedOption ? selectedOption.value : ""
                                )
                              }
                              value={
                                value
                                  ? clientOptions.find(
                                      (opt) => opt.value === value
                                    ) || {
                                      label: value,
                                      value: value,
                                    }
                                  : null
                              }
                              placeholder="Select or create client..."
                              ref={ref}
                              classNamePrefix="react-select"
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Franchise Address */}
                <FormField
                  control={form.control}
                  name="franchiseAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Franchise Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full address of the franchise unit"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* State Head */}
                <FormField
                  control={form.control}
                  name="stateHead"
                  render={() => (
                    <FormItem>
                      <FormLabel>State Head</FormLabel>
                      <FormControl>
                        <Controller
                          control={form.control}
                          name="stateHead"
                          render={({ field: { onChange, value, ref } }) => (
                            <SelectReact
                              ref={ref}
                              isClearable
                              isSearchable
                              options={users.map((user) => ({
                                label: `${user.name} (${user.userId})`,
                                value: user.name,
                              }))}
                              value={
                                value
                                  ? {
                                      label:
                                        users.find((u) => u.name === value)
                                          ?.name +
                                        " (" +
                                        users.find((u) => u.name === value)
                                          ?.userId +
                                        ")",
                                      value,
                                    }
                                  : null
                              }
                              onChange={(selectedOption) =>
                                onChange(
                                  selectedOption ? selectedOption.value : ""
                                )
                              }
                              placeholder="Select state head"
                              classNamePrefix="react-select"
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Authorized Person */}
                <FormField
                  control={form.control}
                  name="authorizedPerson"
                  render={({ field: { onChange, value, ref } }) => (
                    <FormItem>
                      <FormLabel>Authorized Person</FormLabel>
                      <FormControl>
                        <SelectReact
                          ref={ref}
                          isClearable
                          isSearchable
                          options={authorizedPersons.map((user) => ({
                            label: `${user.name} (${user.userId})`,
                            value: user.name,
                          }))}
                          value={
                            value
                              ? authorizedPersons.find((u) => u.name === value)
                                ? {
                                    label: `${value} (${
                                      authorizedPersons.find(
                                        (u) => u.name === value
                                      )?.userId
                                    })`,
                                    value,
                                  }
                                : null
                              : null
                          }
                          onChange={(selectedOption) =>
                            onChange(selectedOption ? selectedOption.value : "")
                          }
                          placeholder="Select authorized person"
                          classNamePrefix="react-select"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services */}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Services Opted</CardTitle>
                  <CardDescription>Select applicable services.</CardDescription>
                </div>
                {/* <AddServiceDialog onAddService={handleAddNewService}>
                  <Button variant="outline" size="sm">
                    Add Service
                  </Button>
                </AddServiceDialog> */}
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="services"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {form.getValues("services").map((service, index) => (
                        <FormField
                          key={index}
                          control={form.control}
                          name={`services.${index}.selected`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-4 shadow-sm hover:shadow-md transition-shadow">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {form.getValues("services")[index].name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage className="mt-2">
                      {form.formState.errors.services?.message}
                    </FormMessage>

                    {/* Add your info message here */}
                    <p className="mt-4 text-sm text-muted-foreground">
                      Can't find your service? Please{" "}
                      <a
                        href="/settings?data="
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        add it from the Settings page
                      </a>
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Assignments & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment & Notes</CardTitle>
              <CardDescription>Assign users and add notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Assignees*/}
              <FormField
                control={form.control}
                name="assignedUsers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Users</FormLabel>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="assignedUsers"
                        render={({ field: { onChange, value, ref } }) => (
                          <SelectReact
                            ref={ref}
                            isMulti
                            options={users.map((user) => ({
                              label: `${user.name} (${user.userId})`, // format: name (userId)
                              value: user._id,
                            }))}
                            value={
                              value
                                ? users
                                    .filter((u) => value.includes(u._id))
                                    .map((u) => ({
                                      label: `${u.name} (${u.userId})`, // same format for selected values
                                      value: u._id,
                                    }))
                                : []
                            }
                            onChange={(selectedOptions) =>
                              onChange(selectedOptions.map((opt) => opt.value))
                            }
                            placeholder="Select one or more users"
                            classNamePrefix="react-select"
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reasonForStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Note / Reason (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., PMEGP status reason..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? isEditing
                  ? "Updating Case..."
                  : "Creating Case..."
                : isEditing
                ? "Update Case"
                : "Create Case"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
