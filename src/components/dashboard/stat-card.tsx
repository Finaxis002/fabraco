import React from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  progress?: number;
  onClick?: () => void;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  progress,
  onClick,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-0 rounded-xl bg-gradient-to-br from-gray-50 to-white",
        "hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
        onClick ? "cursor-pointer focus:ring-2 focus:ring-primary/50" : "",
        className
      )}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyPress={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      aria-label={`View details for ${title}`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {title}
            </span>
            <h3 className="mt-1 text-3xl font-bold text-gray-900">{value}</h3>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>

        {description && (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        )}

        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
                aria-label={`${title} progress ${progress}%`}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
