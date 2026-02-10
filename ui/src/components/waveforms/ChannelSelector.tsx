import { useSources } from "@/hooks/useSources";
import { useStations, useNetworks } from "@/hooks/useStations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Source, Network, Station, Channel } from "@/types";
import { useStation } from "@/hooks/useStations";

interface Props {
  sourceId: number;
  onSourceChange: (id: number) => void;
  networkCode: string;
  onNetworkChange: (code: string) => void;
  stationId: number;
  onStationChange: (id: number) => void;
  channelKey: string;
  onChannelChange: (key: string) => void;
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
}: Props) {
  const { data: sources } = useSources();
  const { data: networks } = useNetworks();
  const { data: stationsData } = useStations({
    network: networkCode,
    limit: 500,
  });
  const { data: stationDetail } = useStation(stationId);

  const stations = stationsData?.stations ?? [];
  const channels = stationDetail?.channels ?? [];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label>Source</Label>
        <Select
          value={sourceId > 0 ? String(sourceId) : ""}
          onValueChange={(v) => onSourceChange(Number(v))}
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
        <Select value={networkCode} onValueChange={onNetworkChange}>
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
          onValueChange={(v) => onStationChange(Number(v))}
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
        <Select value={channelKey} onValueChange={onChannelChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((ch: Channel) => {
              const key = `${ch.location_code || "--"}.${ch.code}`;
              return (
                <SelectItem key={ch.id} value={key}>
                  {key} ({ch.sample_rate}Hz)
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
