import type { CaseStatus, ServiceStatus } from "@/types/franchise";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import icons from lucide-react or your icon library
import { GrInProgress as InProgressIcon } from "react-icons/gr";
import {
  Clock as PendingIcon,
  CheckCircle as CompletedIcon,
  // PlayCircle as InProgressIcon,
  XCircle as RejectedIcon,
} from "lucide-react";

const statusClassMap: Record<string, string> = {
  "New-Case":
    "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 text-xs border border-blue-400",
  "In-Progress":
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 text-xs border border-yellow-400",
  Completed:
    "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 text-xs border border-green-400",
  Rejected:
    "bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900 text-xs border border-orange-400",
};

const statusIconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  "New-Case": PendingIcon,
  "In-Progress": InProgressIcon,
  Completed: CompletedIcon,
  Rejected: RejectedIcon,
};

type StatusIndicatorProps = {
  status: CaseStatus | ServiceStatus | string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

export default function StatusIndicator({
  status,
  size = "md",
  showText = false,
  className,
}: StatusIndicatorProps) {
  const baseClass = statusClassMap[status] || "bg-gray-300 text-black";
  const Icon = statusIconMap[status] || PendingIcon;

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  const textIconSize = iconSizeClasses[size];

  if (showText) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
          baseClass,
          className
        )}
      >
        <Icon className={cn(textIconSize, "shrink-0")} />
        {status}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              sizeClasses[size],
              baseClass,
              className
            )}
          >
            <Icon className={textIconSize} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
