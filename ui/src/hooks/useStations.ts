import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { StationDetail, StationListResponse, Stats, Network, ChannelAvailability } from "@/types";

export function useStations(params?: {
  network?: string;
  station?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.network) searchParams.set("network", params.network);
  if (params?.station) searchParams.set("station", params.station);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const qs = searchParams.toString();
  return useQuery<StationListResponse>({
    queryKey: ["stations", qs],
    queryFn: () => apiFetch(`/api/v1/stations${qs ? `?${qs}` : ""}`),
  });
}

export function useStation(id: number) {
  return useQuery<StationDetail>({
    queryKey: ["stations", id],
    queryFn: () => apiFetch(`/api/v1/stations/${id}`),
    enabled: id > 0,
  });
}

export function useDeleteStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/stations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useNetworks() {
  return useQuery<Network[]>({
    queryKey: ["networks"],
    queryFn: () => apiFetch("/api/v1/networks"),
  });
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => apiFetch("/api/v1/stats"),
  });
}

export function useNetworksBySource(sourceId: number) {
  return useQuery<Network[]>({
    queryKey: ["networks", "source", sourceId],
    queryFn: () => apiFetch(`/api/v1/sources/${sourceId}/networks`),
    enabled: sourceId > 0,
  });
}

export function useStationsBySource(sourceId: number, networkCode: string) {
  const params = new URLSearchParams();
  if (networkCode) params.set("network", networkCode);
  params.set("limit", "500");
  const qs = params.toString();
  return useQuery<StationListResponse>({
    queryKey: ["stations", "source", sourceId, networkCode],
    queryFn: () => apiFetch(`/api/v1/sources/${sourceId}/stations?${qs}`),
    enabled: sourceId > 0,
  });
}

export function useStationAvailability(stationId: number) {
  return useQuery<ChannelAvailability[]>({
    queryKey: ["availability", stationId],
    queryFn: () => apiFetch(`/api/v1/stations/${stationId}/availability`),
    enabled: stationId > 0,
  });
}
