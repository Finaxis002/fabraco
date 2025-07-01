import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import PageHeader from "@/components/ui/page-header";
import {APP_NAME } from "@/lib/constants";
import type { Case } from "@/types/franchise";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2, Eye, ChevronDown, Plus } from "lucide-react";
import StatusIndicator from "@/components/dashboard/status-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface OwnerWithCases {
  ownerName: string;
  cases: Case[];
  avatarUrl?: string;
  dataAIHint?: string;
}

export default function OwnersPage() {
  const [ownersData, setOwnersData] = useState<OwnerWithCases[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = `Owners | ${APP_NAME}`;
    const fetchOwners = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const ownersMap = new Map<string, Case[]>();

      const formattedOwners: OwnerWithCases[] = Array.from(
        ownersMap.entries()
      ).map(([ownerName, cases]) => ({
        ownerName,
        cases,
        avatarUrl: `https://picsum.photos/seed/${ownerName
          .replace(/\s+/g, "-")
          .toLowerCase()}/80/80`,
        dataAIHint: "person business",
      }));

      setOwnersData(
        formattedOwners.sort((a, b) => a.ownerName.localeCompare(b.ownerName))
      );
      setLoading(false);
    };
    fetchOwners();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Franchise Owners"
          description="Loading owner details..."
        />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="border-b p-0">
                <div className="flex items-center p-4 space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[...Array(2)].map((_, j) => (
                    <Skeleton key={j} className="h-16 w-full rounded-md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (ownersData.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Franchise Owners"
          description="Manage and view franchise owners and their cases."
        />
        <div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No owners found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This could be because there are no cases yet.
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create New Owner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Franchise Owners"
        description={`Viewing ${ownersData.length} ${
          ownersData.length === 1 ? "owner" : "owners"
        }`}
      />
      <div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Owner
        </Button>
      </div>

      <div className="space-y-4">
        {ownersData.map((owner) => (
          <Card
            key={owner.ownerName}
            className="overflow-hidden shadow-sm hover:shadow-md transition-shadow px-4"
          >
            <Accordion type="single" collapsible>
              <AccordionItem value={owner.ownerName} className="border-0">
                <AccordionTrigger className="hover:no-underline p-0">
                  <CardHeader className="flex flex-row items-center justify-between w-full p-4 border-b">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={owner.avatarUrl}
                          alt={owner.ownerName}
                        />
                        <AvatarFallback>
                          {owner.ownerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {owner.ownerName}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 text-xs"
                          >
                            {owner.cases.length}{" "}
                            {owner.cases.length === 1 ? "Case" : "Cases"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="px-2 py-0.5 text-xs"
                          >
                            Last updated:{" "}
                            {new Date(
                              owner.cases[0].updatedAt
                            ).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <CardContent className="p-4 space-y-3">
                    {owner.cases.map((c) => (
                      <div
                        key={c.id}
                        className="group flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <RouterLink
                            to={`/cases/${c.id}`}
                            className="font-medium hover:underline hover:text-primary"
                          >
                            {c.unitName}
                          </RouterLink>
                          <p className="text-sm text-muted-foreground mt-1">
                            SRN: {c.srNo}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusIndicator status={c.overallStatus ? c.overallStatus : "Pending"} showText />

                          <Button
                            variant="ghost"
                            size="sm"
                           className="bg-green-500 hover:bg-green-700 text-white"
                            asChild
                          >
                            <RouterLink to={`/cases/${c.id}`} >
                              <Eye className="h-4 w-4 mr-1.5" /> View
                            </RouterLink>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        ))}
      </div>
    </div>
  );
}
