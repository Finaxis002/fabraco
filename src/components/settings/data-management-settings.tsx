"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { MOCK_STATES, MOCK_AREAS } from "@/lib/constants";
import { useState, useEffect } from "react";
import type { StateItem, AreaItem, ServiceDefinition } from "@/types/franchise";
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
  DialogDescription, // <-- Add this line
  DialogFooter,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";

interface DataItem {
  id: string;
  name: string;
  [key: string]: any; // For additional properties like stateId
}

interface DataTableProps<T extends DataItem> {
  title: string;
  description: string;
  items: T[];
  onAddItem: (name: string, additionalProps?: Partial<T>) => void;
  onEditItem: (item: T) => void;
  onDeleteItem: (id: string) => void;
  renderAdditionalCols?: (item: T) => React.ReactNode;
  additionalFieldsForm?: React.ReactNode; // For complex add forms
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(newItemName.trim());
      setNewItemName("");
      setIsDialogOpen(false); // 👈 closes the dialog
    }
  };

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
            </DialogHeader>

            <div className="space-y-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={`Enter ${title.slice(0, -1)} name`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                onClick={() => {
                  handleAddItem();
                }}
              >
                Save
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
                      onClick={() => onDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
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
  const [states, setStates] = useState<StateItem[]>(MOCK_STATES);
  const [areas, setAreas] = useState<AreaItem[]>(MOCK_AREAS);
  const [serviceDefinitions, setServiceDefinitions] = useState<
    ServiceDefinition[]
  >([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ServiceDefinition | null>(null);
  const [editServiceName, setEditServiceName] = useState(editItem?.name || "");

  useEffect(() => {
    if (editItem) {
      setEditServiceName(editItem.name);
    }
  }, [editItem]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axiosInstance.get("/services");
        const formatted = res.data.map((s: any) => ({
          id: s._id,
          name: s.name,
          defaultStatus: "Pending" as ServiceDefinition["defaultStatus"], // optional display logic
        }));
        setServiceDefinitions(formatted as ServiceDefinition[]);
      } catch (err) {
        toast({
          title: "Error loading services",
          description: "Could not fetch services from server",
          variant: "destructive",
        });
      }
    };

    fetchServices();
  }, []);

  // Placeholder CRUD operations - in a real app, these would call an API
  const crudHandler = <T extends DataItem>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    itemName: string
  ) => ({
    add: (name: string, additionalProps?: Partial<T>) => {
      const newItem = {
        id: `${itemName.toLowerCase()}-${Date.now()}`,
        name,
        ...additionalProps,
      } as T;
      setter((prev) => [...prev, newItem]);
      toast({
        title: `${itemName} Added`,
        description: `${name} has been added.`,
      });
    },
    edit: (item: ServiceDefinition) => {
      setEditItem(item);
      setEditDialogOpen(true);
    },
    delete: (id: string) => {
      setter((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: `${itemName} Deleted`,
        description: `${itemName} with ID ${id} has been removed.`,
        variant: "destructive",
      });
    },
  });

  const serviceDefHandler = {
    add: async (name: string, p0: { defaultStatus: string }) => {
      try {
        const res = await axiosInstance.post("/services", {
          name,
        });
        const newItem: ServiceDefinition = {
          id: res.data._id,
          name: res.data.name,
          defaultStatus: "Pending" as ServiceDefinition["defaultStatus"],
        };
        setServiceDefinitions((prev) => [...prev, newItem]);
        toast({
          title: "Service Added",
          description: `${name} has been saved.`,
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "Could not save service.",
          variant: "destructive",
        });
      }
    },

    delete: async (id: string) => {
      try {
        await axiosInstance.delete(`/services/${id}`);
        setServiceDefinitions((prev) => prev.filter((item) => item.id !== id));
        toast({
          title: "Service Deleted",
          description: "Service has been deleted.",
          variant: "destructive",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to delete service",
          variant: "destructive",
        });
      }
    },

    edit: (item: ServiceDefinition) => {
      toast({
        title: "Edit Service",
        description: `Editing ${item.name} (not yet implemented)`,
      });
    },
  };

  const handleEditItem = (item: ServiceDefinition) => {
    setEditItem(item);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    try {
      await axiosInstance.put(`/services/${editItem.id}`, {
        name: editServiceName,
      });

      // Update local state after success
      setServiceDefinitions((prev) =>
        prev.map((svc) =>
          svc.id === editItem.id ? { ...svc, name: editServiceName } : svc
        )
      );
      setEditDialogOpen(false);
      toast({
        title: "Service Updated",
        description: `${editServiceName} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    }
  };

    const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  return (
    <div className="space-y-6">
    
      <DataTable
        title="Manage Service Definitions"
        description="Define the types of compliance services offered."
        items={serviceDefinitions}
        onAddItem={(name) =>
          serviceDefHandler.add(name, { defaultStatus: "Pending" })
        }
        onEditItem={handleEditItem}
        onDeleteItem={serviceDefHandler.delete}
        renderAdditionalCols={(item) => (
          <span className="text-xs text-muted-foreground">
            Default Status: {item.defaultStatus}
          </span>
        )}
        isAdmin={isAdmin}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              <Input
                value={editServiceName}
                onChange={(e) => setEditServiceName(e.target.value)}
                autoFocus
              />
            </DialogDescription>
          </DialogHeader>
          {/* Future: put an input field here and a Save button */}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
