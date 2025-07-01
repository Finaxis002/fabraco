// components/AddServiceDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function AddServiceDialog({
  onAddService,
  children,
}: {
  onAddService: (serviceName: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");

  const handleAddService = () => {
    if (serviceName.trim()) {
      onAddService(serviceName.trim());
      setServiceName("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter service name"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddService();
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService}>Add Service</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}