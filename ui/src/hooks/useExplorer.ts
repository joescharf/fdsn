import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ExploreStation } from "@/types";

interface ExploreParams {
  sourceId: number;
  net?: string;
  sta?: string;
  cha?: string;
  minlat?: string;
  maxlat?: string;
  minlon?: string;
  maxlon?: string;
}

export function useExploreStations(params: ExploreParams | null) {
  const searchParams = new URLSearchParams();
  if (params?.net) searchParams.set("net", params.net);
  if (params?.sta) searchParams.set("sta", params.sta);
  if (params?.cha) searchParams.set("cha", params.cha);
  if (params?.minlat) searchParams.set("minlat", params.minlat);
  if (params?.maxlat) searchParams.set("maxlat", params.maxlat);
  if (params?.minlon) searchParams.set("minlon", params.minlon);
  if (params?.maxlon) searchParams.set("maxlon", params.maxlon);
  const qs = searchParams.toString();

  return useQuery<ExploreStation[]>({
    queryKey: ["explore", params?.sourceId, qs],
    queryFn: () =>
      apiFetch(
        `/api/v1/sources/${params!.sourceId}/explore/stations${qs ? `?${qs}` : ""}`
      ),
    enabled: !!params && params.sourceId > 0,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min — avoid refetching the same external query
  });
}

interface ImportParams {
  source_id: number;
  network: string;
  station: string;
  channel?: string;
  location?: string;
}

export function useImportStations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: ImportParams) =>
      apiFetch<{ imported: number; availability_count: number; availability_error?: string }>("/api/v1/import/stations", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["networks"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
