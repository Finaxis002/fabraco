import AddCaseForm from "@/components/forms/add-case-form";
import PageHeader from "@/components/ui/page-header";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewCasePage() {
  const navigate = useNavigate();
  return (
    <>
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => navigate("/cases")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Button>
      </div>
      <PageHeader
        title="Create New Case"
        description="Provide the necessary details to register a new franchise compliance case."
      />
      <div className="max-w-4xl mx-auto">
        <AddCaseForm />
      </div>
    </>
  );
}
