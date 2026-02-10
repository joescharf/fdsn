import { useState } from "react";
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
  const [sourceId, setSourceId] = useState(0);
  const [networkCode, setNetworkCode] = useState("");
  const [stationId, setStationId] = useState(0);
  const [stationCode, setStationCode] = useState("");
  const [channelKey, setChannelKey] = useState("");
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600 * 1000);
  const [starttime, setStarttime] = useState(isoString(hourAgo));
  const [endtime, setEndtime] = useState(isoString(now));
  const [fetchParams, setFetchParams] = useState<any>(null);

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
            }}
            channelKey={channelKey}
            onChannelChange={setChannelKey}
          />
          <TimeRangeSelector
            starttime={starttime}
            endtime={endtime}
            onStartChange={setStarttime}
            onEndChange={setEndtime}
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
