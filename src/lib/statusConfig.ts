export const SERVICE_STATUS = {
  NEW_CASE: "New-Case",
  IN_PROGRESS: "In-Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
} as const;

export const STATUS_CONFIG: Record<
  string,
  { color: string; lightColor: string }
> = {
  "New-Case": {
    color: "#84c226",       // primary green
    lightColor: "#dbf2b8",
  },
  "In-Progress": {
    color: "#8aba3f",       // olive green
    lightColor: "#e8f5cf",
  },
  Completed: {
    color: "#5a921e",       // dark green
    lightColor: "#d9edb3",
  },
  Rejected: {
    color: "#99be60",       // muted green (NOT red)
    lightColor: "#eef6dc",
  },
};
