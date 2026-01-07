"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { ServiceDefinition } from "@/types/franchise";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";

interface DataItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface DataTableProps<T extends DataItem> {
  title: string;
  description: string;
  items: T[];
  onAddItem: (name: string, additionalProps?: Partial<T>) => Promise<void>;
  onEditItem: (item: T) => void;
  onDeleteItem: (id: string) => Promise<void>;
  renderAdditionalCols?: (item: T) => React.ReactNode;
  isAdmin?: boolean;
}

function DataTable<T extends DataItem>({
  title,
  description,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  renderAdditionalCols,
  isAdmin = false,
}: DataTableProps<T>) {
  const [newItemName, setNewItemName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    
    setIsAdding(true);
    setError("");
    
    try {
      await onAddItem(newItemName.trim());
      // Success - clear form and close dialog
      setNewItemName("");
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Add item error:", error);
      
      // Check for 400 status (backend returns 400 for duplicates)
      if (error.response?.status === 400 || error.response?.status === 409) {
        setError(`"${newItemName}" already exists. Please use a different name.`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to add. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteItem(id);
    } catch (error: any) {
      console.error("Delete error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (isDialogOpen) {
      setError("");
      setNewItemName("");
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (newItemName && error) {
      setError("");
    }
  }, [newItemName]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add {title.slice(0, -1)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {title.slice(0, -1)}</DialogTitle>
              <DialogDescription>
                Enter the name for the new service. Service names must be unique.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={`Enter ${title.slice(0, -1)} name`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemName.trim() && !isAdding) {
                    handleAddItem();
                  }
                }}
                className={error ? "border-destructive" : ""}
                disabled={isAdding}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                onClick={handleAddItem}
                disabled={!newItemName.trim() || isAdding}
              >
                {isAdding ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {renderAdditionalCols && <TableHead>Details</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  {renderAdditionalCols && (
                    <TableCell>{renderAdditionalCols(item)}</TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditItem(item)}
                      className="mr-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No {title.toLowerCase()} added yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DataManagementSettings() {
  const { toast } = useToast();
  const [serviceDefinitions, setServiceDefinitions] = useState<ServiceDefinition[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ServiceDefinition | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Track requests to prevent duplicates
  const pendingRequests = useRef<Set<string>>(new Set());
  
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/services");
      
      const formatted = res.data.map((s: any) => ({
        id: s._id,
        name: s.name,
        defaultStatus: "Pending" as ServiceDefinition["defaultStatus"],
      }));
      
      setServiceDefinitions(formatted);
    } catch (err: any) {
      console.error("Fetch services error:", err);
      if (err.response?.status !== 404) {
        toast({
          title: "Error loading services",
          description: "Could not fetch services from server",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (editItem) {
      setEditServiceName(editItem.name);
    }
  }, [editItem]);

  const handleAddService = async (name: string) => {
    const requestKey = `add-${name}`;
    
    // Prevent duplicate requests
    if (pendingRequests.current.has(requestKey)) {
      throw new Error("Please wait, request is already in progress");
    }
    
    pendingRequests.current.add(requestKey);
    
    try {
      // Check locally first (case-sensitive to match backend)
      const existingService = serviceDefinitions.find(
        service => service.name === name
      );
      
      if (existingService) {
        throw {
          response: { 
            status: 400, 
            data: { 
              message: `Service "${name}" already exists.` 
            } 
          }
        };
      }
      
      // Make the API call
      const res = await axiosInstance.post("/services", { name });
      
      if (res.status >= 200 && res.status < 300) {
        // OPTIMISTIC UPDATE: Add to local state immediately
        const newService: ServiceDefinition = {
          id: res.data._id || res.data.id,
          name: res.data.name || name,
          defaultStatus: "Pending" as ServiceDefinition["defaultStatus"],
        };
        
        setServiceDefinitions(prev => [...prev, newService]);
        
        toast({
          title: "Success",
          description: `Service "${name}" has been added successfully.`,
        });
        
        // Quick refresh to ensure consistency (without loading state)
        setTimeout(async () => {
          try {
            const refreshRes = await axiosInstance.get("/services");
            const formatted = refreshRes.data.map((s: any) => ({
              id: s._id,
              name: s.name,
              defaultStatus: "Pending" as ServiceDefinition["defaultStatus"],
            }));
            setServiceDefinitions(formatted);
          } catch (refreshErr) {
            console.error("Background refresh failed:", refreshErr);
          }
        }, 500);
        
        return;
      }
      
      throw new Error(`Unexpected response status: ${res.status}`);
      
    } catch (err: any) {
      console.error("Add service error:", err);
      
      // If it's a 400 error (duplicate), check if it was actually created
      if (err.response?.status === 400) {
        // Refresh to see current state
        await fetchServices();
        
        // Check if the service now exists in the refreshed list
        const serviceExists = serviceDefinitions.some(
          service => service.name === name
        );
        
        if (serviceExists) {
          // It was created (maybe by another user or race condition)
          // Don't throw error - treat as success
          toast({
            title: "Service Added",
            description: `Service "${name}" is now available.`,
          });
          return;
        } else {
          // It really doesn't exist - show the error
          throw new Error(err.response?.data?.message || "Service already exists");
        }
      }
      
      // For other errors, refresh and re-throw
      await fetchServices();
      throw new Error(err.response?.data?.message || "Failed to create service. Please try again.");
      
    } finally {
      pendingRequests.current.delete(requestKey);
    }
  };

  const handleDeleteService = async (id: string) => {
    const requestKey = `delete-${id}`;
    
    if (pendingRequests.current.has(requestKey)) {
      throw new Error("Delete already in progress");
    }
    
    pendingRequests.current.add(requestKey);
    
    try {
      // Get the service name before deleting (for toast message)
      const serviceToDelete = serviceDefinitions.find(s => s.id === id);
      const serviceName = serviceToDelete?.name || "Service";
      
      // OPTIMISTIC UPDATE: Remove from UI immediately
      setServiceDefinitions(prev => prev.filter(item => item.id !== id));
      
      await axiosInstance.delete(`/services/${id}`);
      
      toast({
        title: "Success",
        description: `${serviceName} has been deleted successfully.`,
      });
      
      // Background refresh
      setTimeout(() => {
        fetchServices();
      }, 300);
      
    } catch (err: any) {
      console.error("Delete service error:", err);
      
      // Refresh to get actual state
      await fetchServices();
      
      // Check if it's a 404 (already deleted)
      if (err.response?.status === 404) {
        toast({
          title: "Service Not Found",
          description: "Service may have already been deleted.",
        });
        return; // Don't throw error, treat as success
      }
      
      throw new Error(err.response?.data?.message || "Failed to delete service");
    } finally {
      pendingRequests.current.delete(requestKey);
    }
  };

  const handleEditService = (item: ServiceDefinition) => {
    setEditItem(item);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    
    const newName = editServiceName.trim();
    if (!newName || newName === editItem.name) return;
    
    const requestKey = `edit-${editItem.id}`;
    
    if (pendingRequests.current.has(requestKey)) {
      toast({
        title: "Please wait",
        description: "Edit already in progress",
        variant: "destructive",
      });
      return;
    }
    
    pendingRequests.current.add(requestKey);
    
    try {
      // Check for duplicates (case-sensitive)
      const existingService = serviceDefinitions.find(
        service => 
          service.id !== editItem.id && 
          service.name === newName
      );
      
      if (existingService) {
        toast({
          title: "Service Already Exists",
          description: `Service "${newName}" already exists.`,
          variant: "destructive",
        });
        return;
      }
      
      // OPTIMISTIC UPDATE
      setServiceDefinitions(prev =>
        prev.map(svc =>
          svc.id === editItem.id ? { ...svc, name: newName } : svc
        )
      );
      
      await axiosInstance.put(`/services/${editItem.id}`, {
        name: newName,
      });
      
      setEditDialogOpen(false);
      setEditItem(null);
      
      toast({
        title: "Success",
        description: `Service updated to "${newName}" successfully.`,
      });
      
      // Background refresh
      setTimeout(() => {
        fetchServices();
      }, 300);
      
    } catch (error: any) {
      console.error("Edit service error:", error);
      
      // Refresh to revert optimistic update
      await fetchServices();
      
      if (error.response?.status === 400) {
        toast({
          title: "Service Already Exists",
          description: error.response?.data?.message || "Service name already exists.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update service",
          variant: "destructive",
        });
      }
    } finally {
      pendingRequests.current.delete(requestKey);
    }
  };

  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  return (
    <div className="space-y-6">
      {isLoading && serviceDefinitions.length === 0 ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading services...</span>
        </div>
      ) : (
        <DataTable
          title="Manage Service Definitions"
          description="Define the types of compliance services offered."
          items={serviceDefinitions}
          onAddItem={handleAddService}
          onEditItem={handleEditService}
          onDeleteItem={handleDeleteService}
          renderAdditionalCols={(item) => (
            <span className="text-xs text-muted-foreground">
              Default Status: {item.defaultStatus}
            </span>
          )}
          isAdmin={isAdmin}
        />
      )}

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditItem(null);
          setEditServiceName("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service name. Make sure the new name is unique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="edit-service-name">Service Name</Label>
            <Input
              id="edit-service-name"
              value={editServiceName}
              onChange={(e) => setEditServiceName(e.target.value)}
              autoFocus
              placeholder="Enter service name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setEditDialogOpen(false);
                setEditItem(null);
                setEditServiceName("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave} 
              disabled={!editServiceName.trim() || editServiceName.trim() === editItem?.name}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}