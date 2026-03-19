import { useQueryClient } from "@tanstack/react-query";
import {
  useListRegulations as useGeneratedListRegulations,
  useCreateRegulation as useGeneratedCreateRegulation,
  useUpdateRegulation as useGeneratedUpdateRegulation,
  useDeleteRegulation as useGeneratedDeleteRegulation,
  useGetRegulationStats as useGeneratedGetRegulationStats,
  getListRegulationsQueryKey,
  getGetRegulationStatsQueryKey,
} from "@workspace/api-client-react";
import type { ListRegulationsParams } from "@workspace/api-client-react/src/generated/api.schemas";

export function useRegulations(params?: ListRegulationsParams) {
  return useGeneratedListRegulations(params);
}

export function useRegulationStats() {
  return useGeneratedGetRegulationStats();
}

export function useCreateRegulation() {
  const queryClient = useQueryClient();
  return useGeneratedCreateRegulation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/regulations"] });
      },
    },
  });
}

export function useUpdateRegulation() {
  const queryClient = useQueryClient();
  return useGeneratedUpdateRegulation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/regulations"] });
      },
    },
  });
}

export function useDeleteRegulation() {
  const queryClient = useQueryClient();
  return useGeneratedDeleteRegulation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/regulations"] });
      },
    },
  });
}
