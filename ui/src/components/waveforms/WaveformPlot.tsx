import { useEffect, useRef, useState } from "react";
import { WaveformFallback } from "./WaveformFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  data: ArrayBuffer | null;
  label: string;
}

interface ParsedTrace {
  times: number[];
  values: number[];
}

export function WaveformPlot({ data, label }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [trace, setTrace] = useState<ParsedTrace | null>(null);
  const [seisplotReady, setSeisplotReady] = useState(false);

  useEffect(() => {
    if (!data || data.byteLength === 0) {
      setTrace(null);
      return;
    }

    // Dynamically import seisplotjs to parse miniSEED
    import("seisplotjs")
      .then((sp) => {
        try {
          const records = sp.miniseed.parseDataRecords(data);
          if (records.length === 0) {
            setTrace(null);
            return;
          }

          const seismograms = sp.miniseed.seismogramPerChannel(records);
          if (seismograms.length === 0) {
            setTrace(null);
            return;
          }

          const seis = seismograms[0];
          const times: number[] = [];
          const values: number[] = [];

          // Extract time-value pairs
          const startMs = seis.startTime.toDate().getTime();
          const sps = seis.sampleRate;
          const y = seis.y;

          for (let i = 0; i < y.length; i++) {
            times.push(startMs + (i / sps) * 1000);
            values.push(y[i]);
          }

          setTrace({ times, values });
          setSeisplotReady(true);
        } catch (e) {
          console.error("Error parsing miniSEED:", e);
          setTrace(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load seisplotjs:", err);
        setTrace(null);
      });
  }, [data]);

  const chartData =
    trace?.times.map((t, i) => ({ time: t, value: trace.values[i] })) ?? [];

  if (!data || data.byteLength === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No waveform data loaded. Select a channel and time range, then fetch.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          {seisplotReady && (
            <TabsTrigger value="seisplot">Seismogram</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chart">
          <WaveformFallback data={chartData} label={label} />
        </TabsContent>

        {seisplotReady && (
          <TabsContent value="seisplot">
            <div ref={canvasRef} className="w-full h-[300px]">
              <WaveformFallback data={chartData} label={`${label} (parsed via seisplotjs)`} />
            </div>
          </TabsContent>
        )}
      </Tabs>

      <p className="text-xs text-muted-foreground">
        {data.byteLength.toLocaleString()} bytes |{" "}
        {chartData.length.toLocaleString()} samples
      </p>
    </div>
  );
}
