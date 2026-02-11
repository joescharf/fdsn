import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChannelSelector } from "./ChannelSelector";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { WaveformPlot } from "./WaveformPlot";
import { useWaveformData } from "@/hooks/useWaveforms";
import { Activity } from "lucide-react";

function isoString(date: Date): string {
  return date.toISOString().slice(0, 19);
}

export function WaveformsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params once on mount for pre-population from channel table clicks
  const initialSourceId = Number(searchParams.get("source_id")) || 0;
  const initialNetwork = searchParams.get("network") || "";
  const initialStationId = Number(searchParams.get("station_id")) || 0;
  const initialStation = searchParams.get("station") || "";
  const initialChannel = searchParams.get("channel") || "";

  const [sourceId, setSourceId] = useState(initialSourceId);
  const [networkCode, setNetworkCode] = useState(initialNetwork);
  const [stationId, setStationId] = useState(initialStationId);
  const [stationCode, setStationCode] = useState(initialStation);
  const [channelKey, setChannelKey] = useState(initialChannel);
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600 * 1000);
  const [starttime, setStarttime] = useState(isoString(hourAgo));
  const [endtime, setEndtime] = useState(isoString(now));
  const [availableRange, setAvailableRange] = useState<{
    earliest: string;
    latest: string;
  } | null>(null);
  const [fetchParams, setFetchParams] = useState<any>(null);

  // Clear search params after reading to keep URL clean
  useEffect(() => {
    if (searchParams.has("source_id")) {
      setSearchParams({}, { replace: true });
    }
  }, []);

  const { data: waveformData, isLoading, isError, error } = useWaveformData(fetchParams);

  const handleFetch = () => {
    if (!sourceId || !networkCode || !stationId || !channelKey) return;
    const [loc, cha] = channelKey.split(".");
    setFetchParams({
      sourceId,
      net: networkCode,
      sta: stationCode,
      loc: loc === "--" ? "" : loc,
      cha,
      starttime,
      endtime,
    });
  };

  const handleAvailabilitySelect = (earliest: string, latest: string) => {
    setAvailableRange({ earliest, latest });
    // Auto-set time range to last hour of available data
    const latestDate = new Date(latest);
    const oneHourBefore = new Date(latestDate.getTime() - 3600 * 1000);
    setStarttime(isoString(oneHourBefore));
    setEndtime(isoString(latestDate));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Waveform Viewer</h2>
        <p className="text-muted-foreground">
          Fetch and display seismic waveform data (miniSEED)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channel Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChannelSelector
            sourceId={sourceId}
            onSourceChange={setSourceId}
            networkCode={networkCode}
            onNetworkChange={setNetworkCode}
            stationId={stationId}
            onStationChange={(id, code) => {
              setStationId(id);
              setStationCode(code);
              setAvailableRange(null);
            }}
            channelKey={channelKey}
            onChannelChange={setChannelKey}
            onAvailabilitySelect={handleAvailabilitySelect}
          />
          <TimeRangeSelector
            starttime={starttime}
            endtime={endtime}
            onStartChange={setStarttime}
            onEndChange={setEndtime}
            availableRange={availableRange}
          />
          <Button onClick={handleFetch} disabled={isLoading || !channelKey}>
            <Activity className="h-4 w-4 mr-2" />
            {isLoading ? "Fetching..." : "Fetch Waveform"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Waveform Display</CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-destructive text-sm mb-2">
              Error: {(error as Error).message}
            </p>
          )}
          <WaveformPlot
            data={waveformData ?? null}
            label={channelKey ? `${networkCode}.${stationCode}.${channelKey}` : ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
