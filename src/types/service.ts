export type ServiceStatus = "Active" | "Inactive";

export interface Service {
  _id: string;
  name: string;
  status: ServiceStatus;
  assignedUsers?: Array<string | { _id: string; userId?: string; name?: string }>;
  // Add other fields as needed
}