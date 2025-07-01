import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  CheckCircle2,
  Loader,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { StatusType } from "@/types/franchise";
import { STATUS_CONFIG } from "@/lib/constants"; // Import for colors

interface ComplianceStatusOverviewProps {
  totalCases: number;
  newCaseCount: number;
  inProgressCount: number;
  completedCount: number;
  rejectedCount: number;
  onStatusClick: (status: StatusType | "Total") => void;
}

interface StatusItemProps {
  label: string;
  count: number;
  total: number;
  icon: React.ElementType;
  onClick: () => void;
  statusKey: StatusType;
}

const StatusItem: React.FC<StatusItemProps> = ({
  label,
  count,
  total,
  statusKey,
  icon: Icon,
  onClick,
}) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorConfig =
    STATUS_CONFIG[statusKey as StatusType] || STATUS_CONFIG["New-Case"];

  return (
    <div
      className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && onClick()}
      aria-label={`View ${label} cases`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center text-sm font-medium">
          <Icon className="h-4 w-4 mr-2" style={{ color: colorConfig.color }} />
          {label}
        </div>
        <span className="text-sm text-muted-foreground">
          {count}/{total}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        style={
          {
            backgroundColor: colorConfig.lightColor,
            "--indicator-color": colorConfig.color,
          } as React.CSSProperties
        }
        indicatorClassName="bg-[var(--indicator-color)]"
      />
    </div>
  );
};

export default function ComplianceStatusOverview({
  totalCases,
   newCaseCount,
  inProgressCount,
  completedCount,
  rejectedCount,
  onStatusClick,
}: ComplianceStatusOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="mr-2 h-5 w-5 text-primary" />
          Compliance Status Overview
        </CardTitle>
        <CardDescription>
          Visual representation of case statuses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusItem
          label="New Cases"
          count={newCaseCount} // Changed from pendingCount
          total={totalCases}
          statusKey="New-Case"
          icon={Clock}
          onClick={() => onStatusClick("New-Case")}
        />
        <StatusItem
          label="In Progress"
          count={inProgressCount}
          total={totalCases}
          statusKey="In-Progress"
          icon={Loader}
          onClick={() => onStatusClick("In-Progress")}
        />
        <StatusItem
          label="Completed / Approved"
          count={completedCount}
          total={totalCases}
          statusKey="Completed" // Using Completed for styling, but represents both
          icon={CheckCircle2}
          onClick={() => onStatusClick("Completed")} // Or navigate to cases filtered by "Completed" OR "Approved"
        />
        {rejectedCount > 0 && (
          <StatusItem
            label="Rejected"
            count={rejectedCount}
            total={totalCases}
            statusKey="Rejected"
            icon={AlertTriangle}
            onClick={() => onStatusClick("Rejected")}
          />
        )}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => onStatusClick("Total")}
        >
          View All Cases
        </Button>
      </CardContent>
    </Card>
  );
}
