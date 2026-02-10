import { useMemo } from "react";
import { useSources } from "@/hooks/useSources";
import {
  useNetworksBySource,
  useStationsBySource,
  useStationAvailability,
} from "@/hooks/useStations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Source, Network, Station, ChannelAvailability } from "@/types";

interface Props {
  sourceId: number;
  onSourceChange: (id: number) => void;
  networkCode: string;
  onNetworkChange: (code: string) => void;
  stationId: number;
  onStationChange: (id: number, code: string) => void;
  channelKey: string;
  onChannelChange: (key: string) => void;
  onAvailabilitySelect?: (earliest: string, latest: string) => void;
}

function formatShortDate(dateStr: string): string {
  return dateStr.slice(0, 10);
}

export function ChannelSelector({
  sourceId,
  onSourceChange,
  networkCode,
  onNetworkChange,
  stationId,
  onStationChange,
  channelKey,
  onChannelChange,
  onAvailabilitySelect,
}: Props) {
  const { data: sources } = useSources();
  const { data: networks } = useNetworksBySource(sourceId);
  const { data: stationsData } = useStationsBySource(sourceId, networkCode);
  const { data: availability } = useStationAvailability(stationId);

  const stations = stationsData?.stations ?? [];

  // Build availability map keyed by "location.channel"
  const availMap = useMemo(() => {
    const m = new Map<string, ChannelAvailability>();
    if (availability) {
      for (const a of availability) {
        const key = `${a.location_code || "--"}.${a.channel_code}`;
        m.set(key, a);
      }
    }
    return m;
  }, [availability]);

  // Sort channels: those with availability first, then by key
  const sortedChannels = useMemo(() => {
    if (!availability) return [];
    return [...availability].sort((a, b) => {
      const aHas = a.earliest != null ? 0 : 1;
      const bHas = b.earliest != null ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      const aKey = `${a.location_code}.${a.channel_code}`;
      const bKey = `${b.location_code}.${b.channel_code}`;
      return aKey.localeCompare(bKey);
    });
  }, [availability]);

  const handleSourceChange = (v: string) => {
    onSourceChange(Number(v));
    onNetworkChange("");
    onStationChange(0, "");
    onChannelChange("");
  };

  const handleNetworkChange = (v: string) => {
    onNetworkChange(v);
    onStationChange(0, "");
    onChannelChange("");
  };

  const handleStationChange = (v: string) => {
    const sta = stations.find((s: Station) => s.id === Number(v));
    onStationChange(Number(v), sta?.code ?? "");
    onChannelChange("");
  };

  const handleChannelChange = (key: string) => {
    onChannelChange(key);
    const avail = availMap.get(key);
    if (avail?.earliest && avail?.latest && onAvailabilitySelect) {
      onAvailabilitySelect(avail.earliest, avail.latest);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label>Source</Label>
        <Select
          value={sourceId > 0 ? String(sourceId) : ""}
          onValueChange={handleSourceChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            {sources?.map((s: Source) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Network</Label>
        <Select value={networkCode} onValueChange={handleNetworkChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Net" />
          </SelectTrigger>
          <SelectContent>
            {networks?.map((n: Network) => (
              <SelectItem key={n.id} value={n.code}>
                {n.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Station</Label>
        <Select
          value={stationId > 0 ? String(stationId) : ""}
          onValueChange={handleStationChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Station" />
          </SelectTrigger>
          <SelectContent>
            {stations.map((s: Station) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Channel</Label>
        <Select value={channelKey} onValueChange={handleChannelChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            {sortedChannels.map((ch: ChannelAvailability) => {
              const key = `${ch.location_code || "--"}.${ch.channel_code}`;
              const hasData = ch.earliest != null;
              return (
                <SelectItem key={ch.channel_id} value={key}>
                  <span className="flex items-center gap-2">
                    <span>{key} ({ch.sample_rate}Hz)</span>
                    {hasData ? (
                      <span className="text-green-600 text-xs">
                        {formatShortDate(ch.earliest!)}–{formatShortDate(ch.latest!)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">no data</span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
