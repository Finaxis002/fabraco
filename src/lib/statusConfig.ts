// statusConfig.ts
export const SERVICE_STATUS = {
  TO_BE_STARTED: "To be Started",
  DETAIL_REQUIRED: "Detail Required",
  IN_PROGRESS: "In-Progress",
  COMPLETED: "Completed",
  
};

export const STATUS_COLORS: Record<string, string> = {
  [SERVICE_STATUS.TO_BE_STARTED]: "#3b82f6", // blue
  [SERVICE_STATUS.DETAIL_REQUIRED]: "#f97316", // orange
  [SERVICE_STATUS.IN_PROGRESS]: "#facc15", // yellow
  [SERVICE_STATUS.COMPLETED]: "#22c55e", // green
};
