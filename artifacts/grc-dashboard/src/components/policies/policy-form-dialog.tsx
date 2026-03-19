import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreatePolicy, useUpdatePolicy } from "@/hooks/use-gap-analysis";
import type { Policy } from "@workspace/api-client-react/src/generated/api.schemas";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["draft", "active", "under_review", "retired"]),
  coveredControls: z.string(), // comma separated
  lastReviewed: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface PolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: Policy | null;
}

export function PolicyFormDialog({ open, onOpenChange, policy }: PolicyFormDialogProps) {
  const isEditing = !!policy;
  
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
      coveredControls: "",
      lastReviewed: "",
    }
  });

  useEffect(() => {
    if (open && policy) {
      reset({
        name: policy.name,
        description: policy.description,
        status: policy.status,
        coveredControls: policy.coveredControls.join(", "),
        lastReviewed: policy.lastReviewed || "",
      });
    } else if (open && !policy) {
      reset({
        name: "",
        description: "",
        status: "draft",
        coveredControls: "",
        lastReviewed: "",
      });
    }
  }, [open, policy, reset]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      coveredControls: data.coveredControls.split(",").map(s => s.trim()).filter(Boolean),
      lastReviewed: data.lastReviewed || null,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: policy.id, data: payload },
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Policy" : "Add New Policy"}</DialogTitle>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Policy Name</label>
            <input {...register("name")} className="form-input" placeholder="e.g., Information Security Policy" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea {...register("description")} className="form-input min-h-[80px]" placeholder="Purpose and scope..." />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="form-label">Status</label>
            <select {...register("status")} className="form-input">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="form-label">Covered Framework Controls (comma separated IDs)</label>
            <input {...register("coveredControls")} className="form-input" placeholder="e.g., ID.AM-1, PR.AC-3" />
            <p className="text-xs text-muted-foreground mt-1">Map to framework controls to improve gap analysis accuracy.</p>
          </div>

          <div>
            <label className="form-label">Last Reviewed Date</label>
            <input type="date" {...register("lastReviewed")} className="form-input" />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Policy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
