// src/pages/EditCasePage.tsx
import AddCaseForm from "@/components/forms/add-case-form";
import PageHeader from "@/components/ui/page-header";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditCasePage() {
  const navigate = useNavigate();
  return (
    <div>
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
        title="Edit Case"
        description="Update details for the selected case."
      />
      <div className="max-w-4xl mx-auto">
        <AddCaseForm />
      </div>
    </div>
  );
}
