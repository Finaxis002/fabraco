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
      className={cn("hover:shadow-lg transition-shadow", onClick ? "cursor-pointer" : "", className)}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`View details for ${title}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-2" aria-label={`${title} progress ${progress}%`} />
        )}
      </CardContent>
    </Card>
  );
}
