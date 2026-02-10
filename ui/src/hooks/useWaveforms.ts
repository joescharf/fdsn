import { useQuery } from "@tanstack/react-query";
import { BASE } from "@/lib/api";

interface WaveformParams {
  sourceId: number;
  net: string;
  sta: string;
  loc: string;
  cha: string;
  starttime: string;
  endtime: string;
}

export function useWaveformData(params: WaveformParams | null) {
  return useQuery<ArrayBuffer>({
    queryKey: ["waveform", params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        source_id: String(params!.sourceId),
        net: params!.net,
        sta: params!.sta,
        loc: params!.loc,
        cha: params!.cha,
        starttime: params!.starttime,
        endtime: params!.endtime,
      });
      const res = await fetch(`${BASE}/api/v1/waveforms/proxy?${sp}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch waveform: ${res.status}`);
      }
      return res.arrayBuffer();
    },
    enabled: !!params,
    staleTime: 60_000,
  });
}
