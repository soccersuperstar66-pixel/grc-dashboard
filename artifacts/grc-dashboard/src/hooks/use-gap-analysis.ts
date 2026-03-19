import { useQueryClient } from "@tanstack/react-query";
import {
  useListFrameworks as useGeneratedListFrameworks,
  useListPolicies as useGeneratedListPolicies,
  useCreatePolicy as useGeneratedCreatePolicy,
  useUpdatePolicy as useGeneratedUpdatePolicy,
  useDeletePolicy as useGeneratedDeletePolicy,
  useAnalyzeGaps as useGeneratedAnalyzeGaps,
} from "@workspace/api-client-react";

export function useFrameworks() {
  return useGeneratedListFrameworks();
}

export function usePolicies() {
  return useGeneratedListPolicies();
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useGeneratedCreatePolicy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/gap-analysis/policies"] });
      },
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useGeneratedUpdatePolicy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/gap-analysis/policies"] });
      },
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useGeneratedDeletePolicy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/gap-analysis/policies"] });
      },
    },
  });
}

export function useGapAnalysis() {
  // Post mutation to get analysis results. We don't invalidate here as it's a read-only complex operation modeled as POST
  return useGeneratedAnalyzeGaps();
}
