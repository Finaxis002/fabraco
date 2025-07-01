import type { ReactNode } from "react";
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode; // For action buttons or other elements
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-10 pb-6 border-b border-border md:flex md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-4xl font-bold leading-tight text-foreground sm:truncate sm:text-5xl tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {children && <div className="mt-6 flex md:ml-6 md:mt-0">{children}</div>}
    </div>
  );
}
