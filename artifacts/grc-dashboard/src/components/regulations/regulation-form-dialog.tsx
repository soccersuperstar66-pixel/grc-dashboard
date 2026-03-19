import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateRegulation, useUpdateRegulation } from "@/hooks/use-regulations";
import type { Regulation } from "@workspace/api-client-react/src/generated/api.schemas";

const formSchema = z.object({
  lawName: z.string().min(1, "Law name is required"),
  jurisdiction: z.enum(["federal", "state", "international"]),
  status: z.enum(["proposed", "enacted", "effective"]),
  summary: z.string().min(1, "Summary is required"),
  relevantPolicies: z.string(), // We'll split this into array on submit
  nextAction: z.string().min(1, "Next action is required"),
  effectiveDate: z.string().optional().nullable(),
  deadlineDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface RegulationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regulation?: Regulation | null;
}

export function RegulationFormDialog({ open, onOpenChange, regulation }: RegulationFormDialogProps) {
  const isEditing = !!regulation;
  
  const createMutation = useCreateRegulation();
  const updateMutation = useUpdateRegulation();
  
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lawName: "",
      jurisdiction: "federal",
      status: "proposed",
      summary: "",
      relevantPolicies: "",
      nextAction: "",
      effectiveDate: "",
      deadlineDate: "",
    }
  });

  useEffect(() => {
    if (open && regulation) {
      reset({
        lawName: regulation.lawName,
        jurisdiction: regulation.jurisdiction,
        status: regulation.status,
        summary: regulation.summary,
        relevantPolicies: regulation.relevantPolicies.join(", "),
        nextAction: regulation.nextAction,
        effectiveDate: regulation.effectiveDate || "",
        deadlineDate: regulation.deadlineDate || "",
      });
    } else if (open && !regulation) {
      reset({
        lawName: "",
        jurisdiction: "federal",
        status: "proposed",
        summary: "",
        relevantPolicies: "",
        nextAction: "",
        effectiveDate: "",
        deadlineDate: "",
      });
    }
  }, [open, regulation, reset]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      relevantPolicies: data.relevantPolicies.split(",").map(s => s.trim()).filter(Boolean),
      effectiveDate: data.effectiveDate || null,
      deadlineDate: data.deadlineDate || null,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: regulation.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Regulation" : "Add New Regulation"}</DialogTitle>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Law Name</label>
              <input {...register("lawName")} className="form-input" placeholder="e.g., Colorado AI Act" />
              {errors.lawName && <p className="text-xs text-destructive mt-1">{errors.lawName.message}</p>}
            </div>

            <div>
              <label className="form-label">Jurisdiction</label>
              <select {...register("jurisdiction")} className="form-input">
                <option value="federal">Federal</option>
                <option value="state">State</option>
                <option value="international">International</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select {...register("status")} className="form-input">
                <option value="proposed">Proposed</option>
                <option value="enacted">Enacted</option>
                <option value="effective">Effective</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="form-label">Summary</label>
              <textarea {...register("summary")} className="form-input min-h-[80px]" placeholder="Brief description of the law..." />
              {errors.summary && <p className="text-xs text-destructive mt-1">{errors.summary.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="form-label">Relevant Policies (comma separated)</label>
              <input {...register("relevantPolicies")} className="form-input" placeholder="e.g., AI Acceptable Use, Data Privacy" />
            </div>

            <div className="col-span-2">
              <label className="form-label">Next Action for GRC Team</label>
              <input {...register("nextAction")} className="form-input" placeholder="e.g., Draft impact assessment" />
              {errors.nextAction && <p className="text-xs text-destructive mt-1">{errors.nextAction.message}</p>}
            </div>

            <div>
              <label className="form-label">Effective Date</label>
              <input type="date" {...register("effectiveDate")} className="form-input" />
            </div>

            <div>
              <label className="form-label">Deadline Date</label>
              <input type="date" {...register("deadlineDate")} className="form-input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Regulation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
