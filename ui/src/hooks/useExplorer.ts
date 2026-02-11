import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ExploreStation, RefreshTarget, ImportResponse } from "@/types";

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
      apiFetch<ImportResponse>("/api/v1/import/stations", {
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

export function useRefreshTargets() {
  return useQuery<RefreshTarget[]>({
    queryKey: ["refresh-targets"],
    queryFn: () => apiFetch("/api/v1/import/refresh-targets"),
  });
}

export interface RefreshAllProgress {
  total: number;
  completed: number;
  currentNetwork: string;
  isRunning: boolean;
  results: ImportResponse[];
}

export function useRefreshAll() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<RefreshAllProgress>({
    total: 0,
    completed: 0,
    currentNetwork: "",
    isRunning: false,
    results: [],
  });

  const run = useCallback(async (targets: RefreshTarget[]) => {
    if (targets.length === 0) return;
    setProgress({ total: targets.length, completed: 0, currentNetwork: targets[0].network_code, isRunning: true, results: [] });

    const results: ImportResponse[] = [];
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      setProgress((p) => ({ ...p, completed: i, currentNetwork: t.network_code }));
      try {
        const res = await apiFetch<ImportResponse>("/api/v1/import/stations", {
          method: "POST",
          body: JSON.stringify({ source_id: t.source_id, network: t.network_code, station: "" }),
        });
        results.push(res);
      } catch {
        results.push({ imported: 0, availability_count: 0, availability_status: "error" });
      }
    }

    setProgress({ total: targets.length, completed: targets.length, currentNetwork: "", isRunning: false, results });
    qc.invalidateQueries({ queryKey: ["stations"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["networks"] });
    qc.invalidateQueries({ queryKey: ["availability"] });

    return results;
  }, [qc]);

  return { progress, run };
}
